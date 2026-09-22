import { useMemo } from 'react';
import type { HistoryEntry } from '../lib/history';
import {
  computeSummary,
  statsByContentType,
  statsByLanguage,
  statsByMode,
  wpmTimeline,
} from '../lib/stats';
import { BarChart } from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { formatTime } from '../lib/format';
import { contentTypeLabel } from '../lib/dictionary';

interface Props {
  history: HistoryEntry[];
  onClear: () => void;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export function Profile({ history, onClear }: Props) {
  const summary = useMemo(() => computeSummary(history), [history]);
  const byMode = useMemo(() => statsByMode(history), [history]);
  const byLanguage = useMemo(() => statsByLanguage(history), [history]);
  const byType = useMemo(() => statsByContentType(history), [history]);
  const timeline = useMemo(() => wpmTimeline(history, 20), [history]);

  if (history.length === 0) {
    return (
      <div className="profile empty">
        <h2>Profile</h2>
        <p className="muted">No sessions yet. Finish a test and your stats will appear here.</p>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <h2>Profile</h2>
        <button className="danger" onClick={onClear}>
          Clear history
        </button>
      </div>

      <div className="summary-grid">
        <StatCard label="Sessions" value={String(summary.totalSessions)} />
        <StatCard label="Avg WPM" value={summary.avgWpm.toFixed(1)} />
        <StatCard label="Best WPM" value={summary.bestWpm.toFixed(1)} />
        <StatCard label="Avg accuracy" value={`${Math.round(summary.avgAccuracy * 100)}%`} />
      </div>

      <div className="chart-grid">
        <section className="chart-card">
          <h3>WPM over time</h3>
          <LineChart data={timeline} />
        </section>
        <section className="chart-card">
          <h3>Average WPM by mode</h3>
          <BarChart data={byMode.map((g) => ({ label: g.label, value: g.avgWpm }))} />
        </section>
        <section className="chart-card">
          <h3>Average WPM by language</h3>
          <BarChart data={byLanguage.map((g) => ({ label: g.label, value: g.avgWpm }))} />
        </section>
        <section className="chart-card">
          <h3>Average WPM by text type</h3>
          <BarChart data={byType.map((g) => ({ label: g.label, value: g.avgWpm }))} />
        </section>
      </div>

      <section className="history">
        <h3>Recent results</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>WPM</th>
              <th>CPM</th>
              <th>Accuracy</th>
              <th>Time</th>
              <th>Language</th>
              <th>Text</th>
              <th>Mode</th>
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
                <td>{contentTypeLabel(h.contentType)}</td>
                <td>{h.seconds === null ? 'Free' : `${h.seconds}s`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
