use std::sync::mpsc;
use std::sync::Mutex;

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use tauri_plugin_store::StoreExt;

const APP_ID: &str = "1551189079960588430";
const LOGO_KEY: &str = "logo";

struct PresenceUpdate {
    details: String,
    state: String,
}

struct PresenceSender(Mutex<mpsc::Sender<PresenceUpdate>>);

#[tauri::command]
fn set_presence(sender: tauri::State<'_, PresenceSender>, details: String, state: String) {
    if let Ok(tx) = sender.0.lock() {
        let _ = tx.send(PresenceUpdate { details, state });
    }
}

fn build_activity<'a>(details: &'a str, state: &'a str) -> activity::Activity<'a> {
    activity::Activity::new()
        .details(details)
        .state(state)
        .assets(activity::Assets::new().large_image(LOGO_KEY).large_text("lock in"))
}

fn presence_loop(rx: mpsc::Receiver<PresenceUpdate>) {
    let mut client = match DiscordIpcClient::new(APP_ID) {
        Ok(c) => c,
        Err(_) => return,
    };
    let _ = client.connect();

    for update in rx {
        if client
            .set_activity(build_activity(&update.details, &update.state))
            .is_err()
        {
            // Discord may have been started after the app — try to reconnect once.
            let _ = client.reconnect();
            let _ = client.set_activity(build_activity(&update.details, &update.state));
        }
    }

    let _ = client.close();
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiSettings {
    base_url: String,
    model: String,
    api_key: String,
}

const DEFAULT_BASE_URL: &str = "https://api.openai.com/v1";
const DEFAULT_MODEL: &str = "gpt-4o-mini";

fn ai_settings(app: &tauri::AppHandle) -> Result<AiSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let base_url = store
        .get("aiBaseUrl")
        .and_then(|v| v.as_str())
        .unwrap_or(DEFAULT_BASE_URL)
        .to_string();
    let model = store
        .get("aiModel")
        .and_then(|v| v.as_str())
        .unwrap_or(DEFAULT_MODEL)
        .to_string();
    let api_key = store
        .get("aiApiKey")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    Ok(AiSettings { base_url, model, api_key })
}

#[tauri::command]
fn get_ai_settings(app: tauri::AppHandle) -> Result<AiSettings, String> {
    ai_settings(&app)
}

#[tauri::command]
fn set_ai_settings(app: tauri::AppHandle, settings: AiSettings) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store
        .set("aiBaseUrl", serde_json::json!(settings.base_url))
        .map_err(|e| e.to_string())?;
    store
        .set("aiModel", serde_json::json!(settings.model))
        .map_err(|e| e.to_string())?;
    store
        .set("aiApiKey", serde_json::json!(settings.api_key))
        .map_err(|e| e.to_string())?;
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
async fn generate_word_list(app: tauri::AppHandle, lang: String, topic: String) -> Result<String, String> {
    let settings = ai_settings(&app)?;
    if settings.api_key.trim().is_empty() {
        return Err("API key is not set. Add it in Style settings.".to_string());
    }

    let prompt = format!(
        "Generate a list of 80 single words about \"{topic}\" in the {lang} language. \
         Return ONLY a JSON array of strings. No prose, no markdown, no punctuation, no spaces."
    );

    let client = reqwest::Client::new();
    let url = format!("{}/chat/completions", settings.base_url.trim_end_matches('/'));
    let resp = client
        .post(&url)
        .bearer_auth(&settings.api_key)
        .json(&serde_json::json!({
            "model": settings.model,
            "messages": [
                { "role": "system", "content": "You return only a JSON array of lowercase single words." },
                { "role": "user", "content": prompt }
            ],
            "temperature": 0.7
        }))
        .send()
        .await
        .map_err(|e| format!("network error: {e}"))?;

    let status = resp.status();
    let body: serde_json::Value = resp.json().await.map_err(|e| format!("bad response: {e}"))?;
    if !status.is_success() {
        return Err(format!("API error {status}: {body}"));
    }

    let content = body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "unexpected response shape".to_string())?
        .to_string();
    Ok(content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = mpsc::channel::<PresenceUpdate>();
    std::thread::spawn(move || presence_loop(rx));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(PresenceSender(Mutex::new(tx)))
        .invoke_handler(tauri::generate_handler![
            set_presence,
            get_ai_settings,
            set_ai_settings,
            generate_word_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
