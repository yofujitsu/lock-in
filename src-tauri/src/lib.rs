use std::sync::mpsc;
use std::sync::Mutex;

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = mpsc::channel::<PresenceUpdate>();
    std::thread::spawn(move || presence_loop(rx));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(PresenceSender(Mutex::new(tx)))
        .invoke_handler(tauri::generate_handler![set_presence])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
