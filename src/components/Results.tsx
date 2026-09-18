import type { TypingMetrics } from '../lib/metrics';
import type { HistoryEntry } from '../lib/history';
import { formatTime } from '../lib/format';

interface Props {
  metrics: TypingMetrics;
  onRestart: () => void;
  history: HistoryEntry[];
}

export function Results({ metrics, onRestart, history }: Props) {
  return (
    <div className="results">
      <h2>Результат</h2>
      <div className="results-grid">
        <div className="stat">
          <div className="label">WPM</div>
          <div className="value">{metrics.wpm.toFixed(1)}</div>
        </div>
        <div className="stat">
          <div className="label">CPM</div>
          <div className="value">{metrics.cpm.toFixed(1)}</div>
        </div>
        <div className="stat">
          <div className="label">Точность</div>
          <div className="value">{metrics.accuracyPercent.toFixed(1)}%</div>
        </div>
        <div className="stat">
          <div className="label">Время</div>
          <div className="value">{formatTime(metrics.elapsedMs)}</div>
        </div>
      </div>
      <button onClick={onRestart}>↻ Пройти ещё раз</button>

      {history.length > 0 && (
        <div className="history">
          <h3>Последние результаты</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>WPM</th>
                <th>CPM</th>
                <th>Точность</th>
                <th>Время</th>
                <th>Язык</th>
                <th>Тип</th>
                <th>Режим</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((h) => (
                <tr key={h.id}>
                  <td>{h.wpm.toFixed(1)}</td>
                  <td>{h.cpm.toFixed(1)}</td>
                  <td>{Math.round(h.accuracy * 100)}%</td>
                  <td>{formatTime(h.elapsedMs)}</td>
                  <td>{h.language.toUpperCase()}</td>
                  <td>{h.contentType === 'sentences' ? 'Предложения' : 'Слова'}</td>
                  <td>{h.seconds === null ? 'Свободно' : `${h.seconds}s`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
