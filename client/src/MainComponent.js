import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./MainComponent.css";

const moodOptions = [
  { value: "grateful", label: "Grateful", emoji: "🙏" },
  { value: "happy", label: "Happy", emoji: "😄" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "focused", label: "Focused", emoji: "🎯" },
  { value: "energized", label: "Energized", emoji: "⚡" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "stressed", label: "Stressed", emoji: "😓" }
];

const findMoodMeta = (mood) => moodOptions.find((option) => option.value === mood) || moodOptions[0];

const MainComponent = () => {
  const [entries, setEntries] = useState([]);
  const [entryText, setEntryText] = useState("");
  const [entryLimit, setEntryLimit] = useState(25);
  const [entryQuery, setEntryQuery] = useState("");
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

  const [moods, setMoods] = useState([]);
  const [moodValue, setMoodValue] = useState("grateful");
  const [moodNote, setMoodNote] = useState("");
  const [moodsLoading, setMoodsLoading] = useState(false);
  const [moodsError, setMoodsError] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const entryFormRef = useRef(null);

  const getStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await axios.get("/api/stats/overview");
      setStats(response.data.data || null);
    } catch (e) {
      setStatsError("Could not load stats. Please try again.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const getEntries = useCallback(async () => {
    try {
      setEntriesLoading(true);
      setEntriesError(null);
      const response = await axios.get(`/api/journal/entries/all?limit=${entryLimit}`);
      const rows = Array.isArray(response.data.rows) ? response.data.rows : [];
      setEntries(rows);
    } catch (e) {
      setEntriesError("Could not load entries. Please try again.");
    } finally {
      setEntriesLoading(false);
    }
  }, [entryLimit]);

  const saveEntry = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await axios.post("/api/journal/entries", {
          text: entryText
        });
        setEntryText("");
        getEntries();
        getStats();
      } catch (e) {
        setEntriesError("Could not submit entry. Please try again.");
      }
    },
    [entryText, getEntries, getStats]
  );

  const getMoods = useCallback(async () => {
    try {
      setMoodsLoading(true);
      setMoodsError(null);
      const response = await axios.get(`/api/moods/all?limit=20`);
      const rows = Array.isArray(response.data.rows) ? response.data.rows : [];
      setMoods(rows);
    } catch (e) {
      setMoodsError("Could not load moods. Please try again.");
    } finally {
      setMoodsLoading(false);
    }
  }, []);

  const saveMood = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        await axios.post("/api/moods", {
          mood: moodValue,
          note: moodNote
        });
        setMoodNote("");
        getMoods();
        getStats();
      } catch (e) {
        setMoodsError("Could not save mood. Please try again.");
      }
    },
    [moodValue, moodNote, getMoods, getStats]
  );

  useEffect(() => {
    getEntries();
  }, [getEntries]);

  useEffect(() => {
    getMoods();
  }, [getMoods]);

  useEffect(() => {
    getStats();
  }, [getStats]);

  const filteredEntries = useMemo(() => {
    if (!entryQuery.trim()) return entries;
    const lowered = entryQuery.toLowerCase();
    return entries.filter((item) => item.text.toLowerCase().includes(lowered));
  }, [entries, entryQuery]);

  const statsLast7 = stats?.last7_days ?? [];
  const statsMoodTrend = stats?.mood_trend ?? [];
  const sortedMoodTrend = useMemo(() => {
    return [...statsMoodTrend].sort((a, b) => (b?.count || 0) - (a?.count || 0));
  }, [statsMoodTrend]);
  const topMood = sortedMoodTrend[0];
  const topMoodMeta = topMood ? findMoodMeta(topMood.mood) : null;
  const maxLast7 = statsLast7.reduce((max, day) => (day.count > max ? day.count : max), 0) || 1;

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
      }).format(new Date());
    } catch (e) {
      return new Date().toDateString();
    }
  }, []);

  const focusEntryForm = useCallback(() => {
    if (entryFormRef.current) {
      entryFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const input = entryFormRef.current.querySelector("input");
      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    }
  }, []);

  return (
    <div className="mc">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-kicker">Today • {todayLabel}</span>
          <h1>Keep your gratitude &amp; mood in sync</h1>
          <p>
            Reflect on highlights, capture how you feel, and watch positive habits build momentum. All
            data refreshes instantly across the microservices.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={focusEntryForm}>
              Add a gratitude note
            </button>
            {topMoodMeta && topMood?.count > 0 && (
              <span className="hero-mood">
                <span className="hero-mood-label">Top mood</span>
                <span className="hero-mood-value">
                  {topMoodMeta.emoji} {topMoodMeta.label}
                  <span className="hero-mood-count">{topMood.count}</span>
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-metric">
            <span className="metric-label">Total entries</span>
            <span className="metric-value">
              {statsLoading ? "…" : stats?.total_entries ?? "—"}
            </span>
          </div>
          <div className="hero-metric">
            <span className="metric-label">Entries today</span>
            <span className="metric-value">
              {statsLoading ? "…" : stats?.entries_today ?? "—"}
            </span>
          </div>
          <div className="hero-metric">
            <span className="metric-label">Current streak</span>
            <span className="metric-value">
              {statsLoading ? "…" : stats ? `${stats.streak_days}d` : "—"}
            </span>
          </div>
        </div>
      </section>

      <div className="mc-grid">
        <div className="mc-card">
          <div className="mc-header">
            <h1 className="mc-title">
              <span className="mc-badge" aria-hidden>
                ✨
              </span>
              Gratitude Journal
            </h1>
            <div className="mc-controls">
              <select
                className="select"
                value={entryLimit}
                onChange={(e) => setEntryLimit(Number(e.target.value))}
                aria-label="Limit entries"
              >
                <option value={10}>Last 10</option>
                <option value={25}>Last 25</option>
                <option value={50}>Last 50</option>
                <option value={100}>Last 100</option>
              </select>
              <button className="btn btn-ghost" onClick={getEntries} disabled={entriesLoading}>
                {entriesLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          <p className="mc-subtitle">Add one thing you're grateful for today.</p>

          {(entriesLoading || entriesError) && (
            <div className={`mc-status ${entriesError ? "error" : "loading"}`} role="status" aria-live="polite">
              {entriesError ? entriesError : "Loading entries…"}
            </div>
          )}

          <div className="mc-values">
            {filteredEntries.length === 0 && !entriesLoading ? (
              entries.length === 0 ? (
                <div className="mc-empty">No entries yet. Add your first one below.</div>
              ) : (
                <div className="mc-empty">No entries match your search.</div>
              )
            ) : (
              filteredEntries.map((item) => (
                <div className="entry" key={item.id}>
                  <span className="chip">{item.text}</span>
                  <span className="entry-meta">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                  </span>
                </div>
              ))
            )}
          </div>

          <form className="mc-form" onSubmit={saveEntry} ref={entryFormRef}>
            <label className="mc-label" htmlFor="entry-input">
              What are you grateful for?
            </label>
            <div className="input-row">
              <input
                id="entry-input"
                className="input"
                value={entryText}
                placeholder="e.g., Morning coffee, a kind message, sunny walk"
                onChange={(event) => {
                  setEntryText(event.target.value.slice(0, 200));
                }}
              />
              <button className="btn btn-primary" disabled={!entryText.trim()}>
                Submit
              </button>
            </div>
            <small className="mc-hint">Keep it short and specific. Max 200 characters.</small>
            <div className="search-row">
              <input
                className="input"
                placeholder="Search entries"
                value={entryQuery}
                onChange={(e) => setEntryQuery(e.target.value)}
                aria-label="Search entries"
              />
            </div>
          </form>
        </div>

        <div className="mc-card">
          <div className="mc-header">
            <h2 className="mc-title">
              <span className="mc-badge" aria-hidden>
                🌈
              </span>
              Mood Tracker
            </h2>
            <button className="btn btn-ghost" onClick={getMoods} disabled={moodsLoading}>
              {moodsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <p className="mc-subtitle">Capture how you feel alongside your gratitude notes.</p>

          {(moodsLoading || moodsError) && (
            <div className={`mc-status ${moodsError ? "error" : "loading"}`} role="status" aria-live="polite">
              {moodsError ? moodsError : "Loading moods…"}
            </div>
          )}

          <form className="mc-form" onSubmit={saveMood}>
            <label className="mc-label" htmlFor="mood-select">
              How are you feeling?
            </label>
            <div className="input-row">
              <select
                id="mood-select"
                className="select"
                value={moodValue}
                onChange={(event) => setMoodValue(event.target.value)}
              >
                {moodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" disabled={moodsLoading}>
                Log mood
              </button>
            </div>
            <textarea
              className="input textarea"
              placeholder="Optional note"
              value={moodNote}
              onChange={(event) => setMoodNote(event.target.value.slice(0, 240))}
              rows={3}
            />
            <small className="mc-hint">Share a quick note to remember why.</small>
          </form>

          <div className="mc-values">
            {moods.length === 0 && !moodsLoading ? (
              <div className="mc-empty">No mood entries yet. Log your first one above.</div>
            ) : (
              moods.map((item) => {
                const meta = findMoodMeta(item.mood);
                return (
                  <div className="entry" key={item.id}>
                    <span className="chip">
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="entry-meta">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                      {item.note ? ` · ${item.note}` : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mc-card">
          <div className="mc-header">
            <h2 className="mc-title">
              <span className="mc-badge" aria-hidden>
                📊
              </span>
              Weekly Insights
            </h2>
            <button className="btn btn-ghost" onClick={getStats} disabled={statsLoading}>
              {statsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {(statsLoading || statsError) && (
            <div className={`mc-status ${statsError ? "error" : "loading"}`} role="status" aria-live="polite">
              {statsError ? statsError : "Loading stats…"}
            </div>
          )}

          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total entries</span>
                <span className="stat-value">{stats.total_entries}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Entries today</span>
                <span className="stat-value">{stats.entries_today}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Current streak</span>
                <span className="stat-value">{stats.streak_days} days</span>
              </div>
              <div className="stat-card stat-card--wide">
                <span className="stat-label">Last 7 days</span>
                <div className="sparkline">
                  {statsLast7.length === 0 ? (
                    <span className="sparkline-empty">Keep logging to unlock insights.</span>
                  ) : (
                    statsLast7.map((day) => {
                      const pct = day.count === 0 ? 0 : Math.min(100, Math.max(14, Math.round((day.count / maxLast7) * 100)));
                      return (
                        <div className="sparkline-bar" key={day.date} title={`${day.date}: ${day.count}`}>
                          <div className="sparkline-fill" style={{ height: `${pct}%` }} />
                          <span className="sparkline-label">{day.date.slice(5)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="stat-card stat-card--wide">
                <span className="stat-label">Mood trend</span>
                <div className="mood-trend">
                  {sortedMoodTrend.length === 0 ? (
                    <span className="mood-trend-empty">Log moods to see trends.</span>
                  ) : (
                    sortedMoodTrend.map((item) => {
                      const meta = findMoodMeta(item.mood);
                      return (
                        <span className="mood-pill" key={item.mood}>
                          {meta.emoji} {meta.label}
                          <span className="mood-count">{item.count}</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mc-empty">No stats yet. Add entries and moods to unlock insights.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainComponent;
