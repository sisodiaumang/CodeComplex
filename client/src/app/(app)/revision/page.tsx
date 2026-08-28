"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { api } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   Revision — spaced repetition schedule

   Card dashboard: four counters, then a retention chart and a category
   breakdown side by side, then one panel per bucket (due / coming up /
   holding). The chart survives the move to cards because it is the only
   thing on the page that shows decay as a shape instead of a number —
   x is when a problem falls due, y is how much of it you've kept.

   Styling is a scoped `rv-` island for the same reason the landing page
   is: globals.css puts an unlayered `*  { border-color }` reset and an
   unlayered `::selection` outside @layer, which silently beat Tailwind's
   layered utilities, and cn() is a plain join rather than tailwind-merge.
   The island rides the shared theme tokens, so light/dark still work —
   it only overrides the greys and the accents that fail contrast.
   ═══════════════════════════════════════════════════════════════ */

interface RevisionItem {
  _id: string;
  questionSlug: string;
  battleType: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topics: string[];
  category: string;
  lastSolvedAt: string;
  solveCount: number;
  nextRevisionDue: string;
  masteryScore: number;
  daysSinceSolved: number;
  dueInDays: number;
}

interface CategorySummary {
  category: string;
  total: number;
  mastered: number;
  retentionRate: number;
  avgMasteryScore: number;
}

interface RevisionDashboardData {
  summary: {
    totalTracked: number;
    dueTodayCount: number;
    reviewSoonCount: number;
    masteredCount: number;
    overallRetentionRate: number;
  };
  dueToday: RevisionItem[];
  reviewSoon: RevisionItem[];
  mastered: RevisionItem[];
  categorySummary: CategorySummary[];
}

/* ── the time axis ──────────────────────────────────────────────
   Overdue compresses into the strip left of the today line, future
   compresses logarithmically to the right, so a 40-day-overdue problem
   and a 90-day-out one both stay on screen and the near dates — where
   all the useful detail is — keep most of the width. */

const AX_TODAY = 20;
const AX_END = 94;

function axisPos(days: number) {
  if (days <= 0) {
    const t = Math.min(1, Math.abs(days) / 30);
    return AX_TODAY - t * (AX_TODAY - 4);
  }
  const t = Math.log1p(Math.min(days, 30)) / Math.log1p(30);
  return AX_TODAY + t * (AX_END - AX_TODAY);
}

/* Ticks run through the same function as the marks, so a label and the
   dots above it can never disagree about where "7d" is. */
const TICKS = [
  { at: 4, label: "overdue", align: "start" },
  { at: AX_TODAY, label: "today", align: "mid" },
  { at: axisPos(2), label: "2d", align: "mid" },
  { at: axisPos(7), label: "7d", align: "mid" },
  { at: axisPos(14), label: "14d", align: "mid" },
  { at: AX_END, label: "30d+", align: "end" },
] as const;

type Urgency = "over" | "soon" | "held";

function urgencyOf(item: RevisionItem): Urgency {
  if (item.dueInDays <= 0) return "over";
  if (item.dueInDays <= 2) return "soon";
  return "held";
}

function dueLabel(item: RevisionItem) {
  if (item.dueInDays < 0) return `${Math.abs(item.dueInDays)}d overdue`;
  if (item.dueInDays === 0) return "due today";
  return `due in ${item.dueInDays}d`;
}

const CSS = `
.rv {
  --ink: var(--color-text);
  --muted: #595959;
  --faint: #6E6E6E;
  --rule: var(--color-border);
  --rule-soft: color-mix(in srgb, var(--color-border) 55%, transparent);
  --lift: rgba(0, 0, 0, 0.035);
  --card: var(--color-surface);
  --act: var(--color-primary);
  --act-ink: #B4470A;
  --act-fg: #0B0B0C;
  --alarm: #B91C1C;
  --display: var(--font-heading), "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --mono: var(--font-code), "JetBrains Mono", ui-monospace, monospace;
  color: var(--ink);
  font-size: 16px;
}

/* Light is the base because globals.css keeps the light palette on :root and
   only swaps it under [data-theme="dark"] — matching that order means no
   flash before the theme store writes the attribute on the client.

   Three tokens are deliberately NOT the shared ones. --color-text-faint
   (#8C8C8C) is 3.1:1 on the light canvas and #FF6B00 as text is 2.6:1, both
   under 4.5:1; --color-loss (#EF4444) is 3.45:1. The values here are
   hand-checked: light muted 6.4:1, faint 4.7:1, act-ink 5.0:1, alarm 5.9:1;
   dark muted 7.3:1, faint 5.6:1, act-ink 7.4:1, alarm 5.7:1. Near-black on
   an orange fill is 6.9:1 light / 7.5:1 dark, where white would be 2.9:1. */
[data-theme="dark"] .rv {
  --muted: #A0A0A0;
  --faint: #8A8A8A;
  --lift: rgba(255, 255, 255, 0.04);
  --act-ink: var(--color-primary);
  --alarm: #F85149;
}

.rv :focus-visible { outline: 2px solid var(--act-ink); outline-offset: 3px; }
.rv-wrap { max-width: 1100px; margin: 0 auto; padding: 0 clamp(16px, 3vw, 28px) 96px; }

/* ── card shell ── */
.rv-card { background: var(--card); border: 1px solid var(--rule); border-radius: 14px; padding: clamp(15px, 2.3vw, 22px); }
.rv-cap { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); margin: 0 0 16px; }

/* ── header ── */
.rv-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 22px; flex-wrap: wrap; padding: clamp(20px, 3vw, 34px) 0 4px; }
.rv-h1 { font-family: var(--display); font-size: clamp(1.9rem, 4vw, 2.6rem); font-weight: 700; letter-spacing: -0.035em; line-height: 1; margin: 0; }
.rv-lede { color: var(--muted); font-size: 14.5px; line-height: 1.5; margin: 10px 0 0; max-width: 48ch; }
.rv-acts { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
.rv-sync { display: inline-flex; align-items: center; gap: 7px; background: none; border: 0; padding: 0; font: inherit; font-size: 13px; color: var(--muted); cursor: pointer; white-space: nowrap; }
.rv-sync:hover { color: var(--ink); }
.rv-sync:disabled { opacity: 0.55; cursor: default; }
.rv-spin { animation: rv-turn 0.9s linear infinite; }
@keyframes rv-turn { to { transform: rotate(360deg); } }
.rv-go { display: inline-flex; align-items: center; height: 40px; padding: 0 20px; border: 0; border-radius: 999px; background: var(--act); color: var(--act-fg); font: inherit; font-size: 14px; font-weight: 700; white-space: nowrap; cursor: pointer; transition: filter 0.16s ease; }
.rv-go:hover { filter: brightness(1.08); }
.rv-go:disabled { opacity: 0.6; cursor: default; }

.rv-note { margin: clamp(18px, 3vw, 26px) 0 0; font-size: 14px; color: var(--muted); }
.rv-note b { color: var(--ink); }

/* ── counters ── */
.rv-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: clamp(18px, 3vw, 26px) 0 0; }
.rv-tile-k { display: block; font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); }
.rv-tile-v { display: block; font-family: var(--display); font-size: clamp(1.55rem, 4.2vw, 2.1rem); font-weight: 700; line-height: 1.04; letter-spacing: -0.03em; margin-top: 10px; }
.rv-tile[data-hot="1"] .rv-tile-v { color: var(--alarm); }

/* ── chart + categories ── */
.rv-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 12px; margin: 12px 0 0; align-items: start; }
/* No categories to break down means the chart would otherwise sit in a 1.4fr
   column with an empty 1fr beside it. */
.rv-grid[data-solo="1"] { grid-template-columns: minmax(0, 1fr); }
.rv-plot { position: relative; height: 132px; border-bottom: 1px solid var(--rule); }
/* The chart card stays mounted when a filter empties it, so the grid doesn't
   reflow under the cursor while you type in the search box. */
.rv-plot-none { display: flex; align-items: center; height: 132px; font-size: 13.5px; color: var(--faint); }
.rv-y { position: absolute; right: 0; font-family: var(--mono); font-size: 9px; color: var(--faint); }
.rv-y-hi { top: 0; }
.rv-y-lo { bottom: 2px; }
.rv-now { position: absolute; top: 0; bottom: 0; width: 1px; background: repeating-linear-gradient(to bottom, var(--faint) 0 3px, transparent 3px 6px); }
.rv-mark { position: absolute; bottom: 0; width: 1px; background: currentColor; transition: height 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
/* Ring in the card colour — not the page colour — keeps two dots legible where
   they land on top of each other, which happens as soon as two problems fall
   due the same day. */
.rv-mark::after { content: ""; position: absolute; top: -3px; left: -3px; width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 2px var(--card); }
.rv-mark[data-u="over"] { color: var(--alarm); }
.rv-mark[data-u="soon"] { color: var(--ink); }
.rv-mark[data-u="held"] { color: var(--faint); }
.rv-mark[data-on="1"] { color: var(--act-ink); z-index: 3; }
.rv-axis { position: relative; height: 26px; font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
.rv-tick { position: absolute; top: 8px; white-space: nowrap; }
.rv-tick[data-align="mid"] { transform: translateX(-50%); }
.rv-tick[data-align="end"] { transform: translateX(-100%); }

.rv-cats { display: flex; flex-direction: column; }
.rv-cat { display: grid; grid-template-columns: minmax(0, 1fr) 54px auto; align-items: center; gap: 12px; width: 100%; background: none; border: 0; border-top: 1px solid var(--rule-soft); padding: 10px 0; font: inherit; color: var(--muted); text-align: left; cursor: pointer; }
.rv-cat:first-child { border-top: 0; }
.rv-cat:hover { color: var(--ink); }
.rv-cat[aria-pressed="true"] { color: var(--act-ink); }
.rv-cat-n { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.09em; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rv-cat-b { position: relative; height: 3px; background: var(--rule); }
.rv-cat-b i { position: absolute; top: 0; bottom: 0; left: 0; background: currentColor; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.rv-cat-v { font-family: var(--mono); font-size: 10.5px; white-space: nowrap; }

/* ── search ── */
.rv-find { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: clamp(22px, 3.4vw, 32px) 0 0; }
.rv-find-l { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); }
.rv-find input { width: min(300px, 100%); background: var(--card); color: var(--ink); border: 1px solid var(--rule); border-radius: 10px; padding: 9px 13px; font: inherit; font-size: 13.5px; }
.rv-find input::placeholder { color: var(--faint); }
.rv-find input:focus { outline: none; border-color: var(--act-ink); }

/* ── section panels ── */
.rv-sec { margin: 12px 0 0; }
.rv-sec-h { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--faint); margin: 0 0 6px; }
.rv-sec-h b { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--rule); color: var(--ink); font-size: 10.5px; letter-spacing: 0.04em; }
.rv-sec-h[data-hot="1"] b { color: var(--alarm); }
.rv-empty { font-size: 13.5px; color: var(--faint); }

.rv-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px 22px; padding: 14px 10px; margin: 0 -10px; border-top: 1px solid var(--rule-soft); transition: background 0.14s ease; }
.rv-row:first-child { border-top: 0; }
.rv-row:hover { background: var(--lift); }
.rv-row-t { font-weight: 600; font-size: 14.5px; }
.rv-row-d { font-family: var(--mono); font-size: 10px; letter-spacing: 0.11em; color: var(--faint); margin-left: 10px; white-space: nowrap; }
.rv-row-m { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-size: 12.5px; color: var(--muted); margin-top: 6px; }
.rv-row[data-u="over"] .rv-when { color: var(--alarm); font-weight: 600; }
.rv-r { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 11px; }
.rv-bar { position: relative; width: 58px; height: 3px; background: var(--rule); flex-shrink: 0; }
.rv-bar i { position: absolute; top: 0; bottom: 0; left: 0; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
.rv-row[data-u="over"] .rv-bar i { background: var(--alarm); }
.rv-row[data-u="soon"] .rv-bar i { background: var(--ink); }
.rv-row[data-u="held"] .rv-bar i { background: var(--faint); }
.rv-do { display: inline-flex; align-items: center; justify-content: center; height: 34px; padding: 0 15px; border: 1px solid var(--rule); border-radius: 999px; background: none; font: inherit; font-size: 12.5px; font-weight: 600; color: var(--act-ink); white-space: nowrap; cursor: pointer; transition: border-color 0.14s ease, background 0.14s ease; }
.rv-do:hover { border-color: var(--act-ink); background: var(--lift); }
.rv-do:disabled { color: var(--faint); cursor: default; }

/* ── narrow widths ────────────────────────────────────────────────
   Last in the sheet on purpose: these are single-class selectors, so they
   only beat the rules above them on source order. */

/* The chart needs the full column before the category list can sit beside it —
   under this the two share ~330px each and the axis labels collide. */
@media (max-width: 900px) {
  .rv-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 620px) {
  .rv-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rv-row { grid-template-columns: minmax(0, 1fr); }
  .rv-do { justify-self: start; }
  .rv-top { align-items: flex-start; }
  .rv-find input { width: 100%; }
  .rv-plot, .rv-plot-none { height: 104px; }
}

/* The two header actions stop fitting beside each other before the title does,
   so they go full width rather than letting "Start revising" wrap mid-word. */
@media (max-width: 420px) {
  .rv-acts { width: 100%; justify-content: space-between; gap: 12px; }
  .rv-tiles { gap: 10px; }
}
`;

export default function RevisionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [launching, setLaunching] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [stagger, setStagger] = useState(true);

  const dashboardQuery = useQuery({
    queryKey: ["revision", "dashboard"],
    queryFn: async () => {
      const res = await api<{ success?: boolean; data?: RevisionDashboardData }>("/revision");
      return (res.data ?? res) as RevisionDashboardData;
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => api("/revision/sync", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revision", "dashboard"] });
    },
  });

  const data = dashboardQuery.data;

  /* globals.css zeroes transition-duration under prefers-reduced-motion but not
     transition-delay, so the stagger has to be switched off in JS. */
  useEffect(() => {
    setStagger(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!data) return;
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [data]);

  async function revise(item: RevisionItem) {
    setLaunching(item.questionSlug);
    try {
      const room = await api<{ data?: { roomCode?: string }; roomCode?: string }>("/battle", {
        method: "POST",
        body: {
          battleType: item.battleType || "DSA",
          difficulty: item.difficulty || "MEDIUM",
          topics: item.topics && item.topics.length > 0 ? item.topics : ["ARRAY"],
          maxTeamSize: 1,
          isRanked: false,
          isSolo: true,
          isPrivate: true,
          questionSlug: item.questionSlug,
        },
      });

      const dataObj = room.data ?? room;
      const code = dataObj.roomCode;
      if (!code) throw new Error("Room created but no room code returned.");
      router.push(`/battle/${code}`);
    } catch (err) {
      console.error("Failed to open a practice room:", err);
      setLaunching(null);
    }
  }

  const delay = (i: number) => (stagger ? `${Math.min(i, 14) * 45}ms` : "0ms");

  function filter(list: RevisionItem[]) {
    let out = list;
    if (category !== "ALL") out = out.filter((i) => i.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    return out;
  }

  /* Most overdue first, then weakest retention — so the top of the list is
     always the thing worth doing next, and the header button can just take it. */
  const byUrgency = (a: RevisionItem, b: RevisionItem) =>
    a.dueInDays - b.dueInDays || a.masteryScore - b.masteryScore;

  const due = filter(data?.dueToday ?? []).sort(byUrgency);
  const soon = filter(data?.reviewSoon ?? []).sort(byUrgency);
  const held = filter(data?.mastered ?? []).sort(byUrgency);
  const points = [...due, ...soon, ...held];

  const tracked = data?.summary.totalTracked ?? 0;
  const next = due[0];
  const hasCats = (data?.categorySummary?.length ?? 0) > 0;

  const tiles = data
    ? [
        { key: "tracked", label: "Tracked", value: `${data.summary.totalTracked}`, hot: false },
        {
          key: "due",
          label: "Due now",
          value: `${data.summary.dueTodayCount}`,
          hot: data.summary.dueTodayCount > 0,
        },
        { key: "held", label: "Holding", value: `${data.summary.masteredCount}`, hot: false },
        {
          key: "kept",
          label: "Retention",
          value: `${Math.round(data.summary.overallRetentionRate ?? 0)}%`,
          hot: false,
        },
      ]
    : [];

  const sections = [
    { key: "due", head: "Due now", items: due, hot: true, empty: "Nothing due. You're current." },
    {
      key: "soon",
      head: "Coming up",
      items: soon,
      hot: false,
      empty: "Nothing falls due in the next two days.",
    },
    {
      key: "held",
      head: "Holding",
      items: held,
      hot: false,
      empty: "Nothing has reached long-term memory yet.",
    },
  ];

  return (
    <div className="rv">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rv-wrap">
        <div className="rv-top">
          <div>
            <h1 className="rv-h1">Revision</h1>
            <p className="rv-lede">
              Problems fade after you solve them. This is what to revisit, in the
              order the decay says to do it.
            </p>
          </div>

          <div className="rv-acts">
            <button
              type="button"
              className="rv-sync"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RotateCcw className={syncMutation.isPending ? "size-3.5 rv-spin" : "size-3.5"} />
              {syncMutation.isPending ? "Syncing" : "Sync history"}
            </button>

            {next && (
              <button
                type="button"
                className="rv-go"
                disabled={!!launching}
                onClick={() => revise(next)}
              >
                {launching ? "Opening room" : "Start revising"}
              </button>
            )}
          </div>
        </div>

        {dashboardQuery.isLoading ? (
          <p className="rv-note">Loading your schedule…</p>
        ) : tracked === 0 ? (
          <p className="rv-note">
            Nothing tracked yet — finish a battle and the problem shows up here on a schedule.
          </p>
        ) : (
          <>
            <div className="rv-tiles">
              {tiles.map((tile) => (
                <div
                  key={tile.key}
                  className="rv-card rv-tile"
                  data-hot={tile.hot ? "1" : undefined}
                >
                  <span className="rv-tile-k">{tile.label}</span>
                  <span className="rv-tile-v">{tile.value}</span>
                </div>
              ))}
            </div>

            <div className="rv-grid" data-solo={hasCats ? undefined : "1"}>
              <div className="rv-card">
                <p className="rv-cap">Retention against due date</p>
                {points.length === 0 ? (
                  <p className="rv-plot-none">Nothing matches this filter.</p>
                ) : (
                  <>
                    <div
                      className="rv-plot"
                      role="img"
                      aria-label={`Retention plotted against due date for ${points.length} tracked problems. The list below has the same information.`}
                    >
                      <span className="rv-y rv-y-hi" aria-hidden>100</span>
                      <span className="rv-y rv-y-lo" aria-hidden>0</span>
                      <span className="rv-now" style={{ left: `${AX_TODAY}%` }} aria-hidden />
                      {points.map((item, i) => (
                        <span
                          key={item._id || item.questionSlug}
                          className="rv-mark"
                          data-u={urgencyOf(item)}
                          data-on={hover === item.questionSlug ? "1" : undefined}
                          style={{
                            left: `${axisPos(item.dueInDays)}%`,
                            height: ready ? `${Math.max(2, item.masteryScore)}%` : 0,
                            transitionDelay: delay(i),
                          }}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <div className="rv-axis" aria-hidden>
                      {TICKS.map((tick) => (
                        <span
                          key={tick.label}
                          className="rv-tick"
                          data-align={tick.align}
                          style={{ left: `${tick.at}%` }}
                        >
                          {tick.label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {hasCats && (
                <div className="rv-card">
                  <p className="rv-cap">By category</p>
                  <div className="rv-cats">
                    {data!.categorySummary.map((cat, i) => {
                      const on = category === cat.category;
                      return (
                        <button
                          key={cat.category}
                          type="button"
                          className="rv-cat"
                          aria-pressed={on}
                          onClick={() => setCategory(on ? "ALL" : cat.category)}
                        >
                          <span className="rv-cat-n">{cat.category}</span>
                          <span className="rv-cat-b">
                            <i
                              style={{
                                width: ready ? `${cat.avgMasteryScore}%` : 0,
                                transitionDelay: delay(i),
                              }}
                            />
                          </span>
                          <span className="rv-cat-v">
                            {cat.mastered}/{cat.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="rv-find">
              <span className="rv-find-l">
                {category === "ALL" ? "All problems" : category}
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by title or topic"
                aria-label="Filter tracked problems"
              />
            </div>

            {sections.map((sec) => (
              <section className="rv-sec" key={sec.key}>
                <h2
                  className="rv-sec-h"
                  data-hot={sec.hot && sec.items.length > 0 ? "1" : undefined}
                >
                  {sec.head} <b>{sec.items.length}</b>
                </h2>

                <div className="rv-card">
                  {sec.items.length === 0 ? (
                    <p className="rv-empty">{sec.empty}</p>
                  ) : (
                    sec.items.map((item, i) => (
                      <div
                        key={item._id || item.questionSlug}
                        className="rv-row"
                        data-u={urgencyOf(item)}
                        onMouseEnter={() => setHover(item.questionSlug)}
                        onMouseLeave={() => setHover(null)}
                      >
                        <div>
                          <span className="rv-row-t">{item.title}</span>
                          <span className="rv-row-d">{item.difficulty}</span>
                          <div className="rv-row-m">
                            <span className="rv-when">{dueLabel(item)}</span>
                            <span>
                              {item.daysSinceSolved === 0
                                ? "solved today"
                                : `solved ${item.daysSinceSolved}d ago`}
                            </span>
                            <span>{item.category}</span>
                            <span>{item.solveCount}× solved</span>
                            <span className="rv-r">
                              <span className="rv-bar">
                                <i
                                  style={{
                                    width: ready ? `${item.masteryScore}%` : 0,
                                    transitionDelay: delay(i),
                                  }}
                                />
                              </span>
                              {item.masteryScore}% kept
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="rv-do"
                          disabled={launching === item.questionSlug}
                          onClick={() => revise(item)}
                        >
                          {launching === item.questionSlug ? "Opening room" : "Revise →"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
