"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { api } from "@/lib/api";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ELO_TIERS } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";

/* ═══════════════════════════════════════════════════════════════
   Marketing page palette and data structures
   ═══════════════════════════════════════════════════════════════ */

const STARTING_RATING = 1200;

/** Ascending Bronze → Grandmaster. Bar length encodes rating floor. */
const LADDER = ELO_TIERS.map((tier, i) => {
  const next = ELO_TIERS[i + 1];
  return {
    label: tier.label,
    band: next ? `${tier.minRating}` : `${tier.minRating}+`,
    isStart: tier.minRating === STARTING_RATING,
  };
});

/* ── Battle modes. Topic counts are the real TOPICS_BY_MODE lengths
      from src/app/(app)/battle/page.tsx ─────────────────────────── */

type Mode = {
  key: string;
  name: string;
  copy: string;
  topics: number;
  glyph: ReactNode;
};

const MODES: Mode[] = [
  {
    key: "dsa",
    name: "DSA",
    copy: "Algorithms against a running clock. Arrays and strings through trees, graphs, DP, backtracking and tries.",
    topics: 16,
    glyph: (
      <>
        <circle cx="8" cy="34" r="5" />
        <circle cx="22" cy="10" r="5" />
        <circle cx="36" cy="34" r="5" />
        <path d="M11.5 30 18.5 14M25.5 14 32.5 30M13 34h18" />
      </>
    ),
  },
  {
    key: "bugfix",
    name: "Bug Fix",
    copy: "You start from code that already fails. Find the break, fix it, and get every test back to green before the other side does.",
    topics: 13,
    glyph: (
      <>
        <path d="M4 10h36M4 34h36M4 22h11M29 22h11" />
        <path d="M17 17l10 10M27 17l-10 10" />
      </>
    ),
  },
  {
    key: "frontend",
    name: "Frontend",
    copy: "Rebuild a layout under time pressure — responsive, accessible, animated. Judged on what actually renders.",
    topics: 7,
    glyph: (
      <>
        <rect x="4" y="7" width="36" height="30" />
        <path d="M4 16h36M17 16v21" />
      </>
    ),
  },
  {
    key: "backend",
    name: "Backend",
    copy: "Wire the thing up: REST, auth, ORM, caching, queues, rate limits, WebSockets, payments.",
    topics: 15,
    glyph: (
      <>
        <ellipse cx="22" cy="11" rx="12" ry="4.5" />
        <path d="M10 11v9c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-9" />
        <path d="M10 20v9c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-9" />
      </>
    ),
  },
  {
    key: "promptwar",
    name: "Prompt War",
    copy: "Write a prompt, and the suite tests how well it directs an LLM to follow schema, resist jailbreaks, and parse edge cases.",
    topics: 9,
    glyph: (
      <>
        <path d="M14 12 6 22l8 10M30 12l8 10-8 10" />
        <path d="M22 18l4 4-4 4-4-4z" />
      </>
    ),
  },
];

const SEQUENCE = [
  { head: "Queue up, or send a code", copy: "Enter public matchmaking, or open a private room and share the join code." },
  { head: "Same problem, same second", copy: "Both sides get identical statements and test cases the moment the room starts." },
  { head: "Submit and watch tests run", copy: "Your code builds and executes in an isolated container. You see what passed." },
  { head: "The clock decides, rating moves", copy: "Elo settles before you leave the room, and the problem enters your revision queue." },
];

const BETWEEN = [
  { name: "Revision tracker", copy: "Everything you solve comes back on a schedule — due today, review soon, mastered — so it sticks." },
  { name: "Achievements", copy: "Unlockables graded by rarity, for the things worth doing more than once." },
  { name: "Match history", copy: "Every duel you've played, with the rating swing still attached to it." },
  { name: "Friends", copy: "Add the people who beat you. Challenge them back with a room code." },
];

const RUNTIMES = ["C++", "Python", "JavaScript", "Java"];

const FOOTER_COLS = [
  { head: "Start", links: [{ label: "Sign up", href: "/signup" }, { label: "Log in", href: "/login" }] },
  { head: "Learn", links: [{ label: "About", href: "/about" }, { label: "FAQ", href: "/faq" }, { label: "Guidelines", href: "/guidelines" }] },
  { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
  { head: "Talk", links: [{ label: "Contact", href: "/contact" }, { label: "Email support", href: "mailto:support@codecomplex.site" }] },
];

const CSS = `
html { background: #0B0B0C; }
html[data-theme="light"] { background: #FAF8F4; }

.cc {
  --ink: #0B0B0C;
  --band: #101012;
  --ink-blur: rgba(11,11,12,0.86);
  --fg: #EFEDE8;
  --fg-muted: #A3A099;
  --fg-faint: #85827B;
  --rule: rgba(255,255,255,0.12);
  --rule-soft: rgba(255,255,255,0.07);
  --rule-strong: rgba(255,255,255,0.32);
  --orange-fill: #FF7A1A;
  --orange-hi: #FF9040;
  --orange-ink: #FF7A1A;
  background: var(--ink);
  color: var(--fg);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  min-height: 100vh;
  font-size: 16px;
  line-height: 1.6;
}

[data-theme="light"] .cc {
  --ink: #FAF8F4;
  --band: #F1ECE3;
  --ink-blur: rgba(250,248,244,0.88);
  --fg: #141310;
  --fg-muted: #4F4B44;
  --fg-faint: #666259;
  --rule: rgba(0,0,0,0.15);
  --rule-soft: rgba(0,0,0,0.085);
  --rule-strong: rgba(0,0,0,0.34);
  --orange-ink: #B04A08;
}

.cc-wrap { width: 100%; max-width: 1160px; margin: 0 auto; padding: 0 26px; }
.cc-sec { padding: clamp(60px, 8.5vw, 126px) 0; }
.cc-sec-rule { border-top: 1px solid var(--rule-soft); }

.cc a { text-decoration: none; }
.cc a:focus-visible, .cc button:focus-visible, .cc input:focus-visible { outline: 2px solid var(--orange-ink); outline-offset: 3px; }
.cc ::selection { background: var(--orange-fill); color: #0B0B0C; }

.cc-eyebrow { display: inline-flex; gap: 9px; align-items: baseline; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--fg-muted); }
.cc-eyebrow::before { content: "{"; color: var(--orange-ink); }
.cc-eyebrow::after  { content: "}"; color: var(--orange-ink); }

.cc-h1 { font-weight: 700; font-size: clamp(2.4rem, 10.5vw, 7.8rem); line-height: 0.88; letter-spacing: -0.045em; margin: clamp(22px, 3vw, 34px) 0 0; }
.cc-h2 { font-weight: 700; font-size: clamp(1.85rem, 4.4vw, 3.3rem); line-height: 1.02; letter-spacing: -0.032em; margin: 16px 0 0; max-width: 22ch; }
.cc-lede { font-size: clamp(1.05rem, 1.9vw, 1.4rem); line-height: 1.5; color: var(--fg-muted); max-width: 40ch; }
.cc-body { font-size: 15.5px; color: var(--fg-muted); max-width: 56ch; margin: 20px 0 0; }
.cc-note { font-family: ui-monospace, monospace; font-size: 11.5px; letter-spacing: 0.05em; color: var(--fg-faint); }

.cc-btn { display: inline-flex; align-items: center; gap: 9px; height: 48px; padding: 0 24px; border: 0; border-radius: 999px; background: var(--orange-fill); color: #0B0B0C; font-weight: 700; font-size: 15.5px; cursor: pointer; transition: background .18s ease; }
.cc-btn:hover { background: var(--orange-hi); }

/* white-space + flex-shrink together: as a flex child inside .cc-navend the pill
   would otherwise be squeezed under its own text width and wrap "SIGN UP" onto
   two lines on a phone. */
.cc-pill { display: inline-flex; align-items: center; gap: 7px; height: 33px; padding: 0 15px; border-radius: 999px; border: 1px solid var(--rule); font-family: ui-monospace, monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.11em; text-transform: uppercase; color: var(--fg-muted); white-space: nowrap; }
.cc-pill:hover { color: var(--fg); border-color: var(--rule-strong); }

.cc-quiet { color: var(--fg-muted); white-space: nowrap; }
.cc-quiet:hover { color: var(--fg); }

.cc-nav { position: sticky; top: 0; z-index: 50; background: var(--ink-blur); backdrop-filter: blur(14px); border-bottom: 1px solid var(--rule-soft); }
.cc-nav-in { display: flex; align-items: center; justify-content: space-between; gap: 22px; height: 66px; }
.cc-brand { display: flex; align-items: center; gap: 10px; color: var(--fg); font-weight: 700; font-size: 17px; flex-shrink: 0; white-space: nowrap; }
.cc-navlinks { display: flex; gap: 28px; font-size: 13.5px; }
.cc-navend { display: flex; align-items: center; gap: 18px; font-size: 13.5px; flex-shrink: 0; }
.cc-navend > * { flex: 0 0 auto; }
.cc-tt { color: var(--fg-muted); }
.cc-tt:hover { color: var(--fg); background: var(--rule-soft); }

/* ── mobile menu ──────────────────────────────────────────────────
   #modes / #ladder / #agents have no other entry point, so hiding
   .cc-navlinks under 900px without a replacement stranded every phone
   visitor at the top of the page with no way to reach the sections. The
   burger opens a right-hand sheet that carries those four links plus the
   two auth actions the bar itself drops on the narrowest screens. */
.cc-burger { display: none; align-items: center; justify-content: center; width: 38px; height: 38px; margin-right: -7px; background: none; border: 0; border-radius: 8px; color: var(--fg-muted); cursor: pointer; }
.cc-burger:hover { color: var(--fg); background: var(--rule-soft); }

/* Above .cc-nav's z-index 50 so the sheet covers the sticky bar rather than
   sliding under it. */
.cc-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, 0.55); }
.cc-sheet { position: fixed; top: 0; right: 0; bottom: 0; z-index: 61; width: min(310px, 84vw); display: flex; flex-direction: column; padding: 18px 22px 26px; background: var(--band); border-left: 1px solid var(--rule); overflow-y: auto; overscroll-behavior: contain; }
.cc-sheet-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 42px; margin-bottom: 12px; }
.cc-sheet-lbl { font-family: ui-monospace, monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--fg-faint); }
.cc-sheet-x { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; margin-right: -9px; background: none; border: 0; border-radius: 8px; color: var(--fg-muted); cursor: pointer; }
.cc-sheet-x:hover { color: var(--fg); background: var(--rule-soft); }
.cc-sheet-a { display: block; padding: 13px 0; border-top: 1px solid var(--rule-soft); font-size: 17px; font-weight: 600; color: var(--fg); }
.cc-sheet-a:first-of-type { border-top: 0; }
.cc-sheet-foot { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--rule); display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.cc-sheet-foot .cc-btn { width: 100%; justify-content: center; }

@media (max-width: 900px) {
  .cc-navlinks { display: none; }
  .cc-burger { display: inline-flex; }
}
/* Safety net for a rotate-to-landscape that crosses the breakpoint before the
   resize listener unmounts the sheet. */
@media (min-width: 901px) {
  .cc-scrim, .cc-sheet { display: none; }
}

.cc-hero { padding: clamp(48px, 8vw, 104px) 0 clamp(52px, 7vw, 96px); }
.cc-spectrum { display: flex; height: 5px; margin: clamp(30px, 4vw, 46px) 0 0; max-width: 780px; gap: 1px; }
.cc-spectrum i { flex: 1; transform: scaleX(1); background: var(--tone-d); }
[data-theme="light"] .cc-spectrum i { background: var(--tone-l); }
.cc-spectrum i[data-idx="0"] { --tone-d: #4D8DFF; --tone-l: #1A55C7; }
.cc-spectrum i[data-idx="1"] { --tone-d: #FF5A52; --tone-l: #C22A22; }
.cc-spectrum i[data-idx="2"] { --tone-d: #2FCBDB; --tone-l: #0A6B75; }
.cc-spectrum i[data-idx="3"] { --tone-d: #35C46A; --tone-l: #12703C; }
.cc-spectrum i[data-idx="4"] { --tone-d: #B57BF5; --tone-l: #7331C4; }

.cc-herofoot { display: flex; flex-wrap: wrap; align-items: center; gap: clamp(18px, 3vw, 40px); margin: clamp(30px, 4vw, 46px) 0 0; }

.cc-ladder { display: flex; align-items: stretch; gap: clamp(5px, 1.3vw, 15px); height: clamp(190px, 27vw, 300px); margin: clamp(34px, 5vw, 60px) 0 0; }
.cc-rung { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 11px; color: var(--tone-d); }
[data-theme="light"] .cc-rung { color: var(--tone-l); }
/* --fill is the rating floor as a proportion of the tallest rung. It drives the
   bar's height on desktop and its width in the stacked mobile layout, so both
   orientations read one number instead of two sets of per-tier rules. */
.cc-rung[data-tier="Bronze"]      { --tone-d: #C1743C; --tone-l: #8A4A17; --fill: 26%; }
.cc-rung[data-tier="Silver"]      { --tone-d: #A8B2BD; --tone-l: #55606B; --fill: 38%; }
.cc-rung[data-tier="Gold"]        { --tone-d: #E3A81B; --tone-l: #7A5A05; --fill: 50%; }
.cc-rung[data-tier="Platinum"]    { --tone-d: #2BB8C4; --tone-l: #0F6E78; --fill: 62%; }
.cc-rung[data-tier="Diamond"]     { --tone-d: #5B85F5; --tone-l: #2A4FB8; --fill: 74%; }
.cc-rung[data-tier="Master"]      { --tone-d: #B06BF5; --tone-l: #6B32A8; --fill: 86%; }
.cc-rung[data-tier="Grandmaster"] { --tone-d: #FF3E6C; --tone-l: #B3123F; --fill: 100%; }
.cc-rung-top { font-family: ui-monospace, monospace; font-size: 11px; color: var(--fg-faint); }
/* Orange rating floor marks the tier every new account opens in. Colour instead
   of the old "You start here" label: that label wrapped to two lines inside a
   ~55px phone column and pushed its rung's bar off the shared baseline. */
.cc-rung[data-start] .cc-rung-top { color: var(--orange-ink); font-weight: 700; }
.cc-rung-track { position: relative; flex: 1; min-height: 0; }
.cc-rung-bar { position: absolute; left: 0; right: 0; bottom: 0; height: var(--fill); background: currentColor; }
.cc-rung-name { font-weight: 700; font-size: clamp(9.5px, 1.05vw, 12px); text-transform: uppercase; letter-spacing: 0.06em; overflow: hidden; text-overflow: ellipsis; }

.cc-rows { margin: clamp(28px, 4vw, 46px) 0 0; }
.cc-row { display: grid; grid-template-columns: minmax(130px, 200px) minmax(0, 1fr); gap: clamp(16px, 3vw, 42px); padding: 24px 0; border-top: 1px solid var(--rule-soft); }
.cc-row-h { font-weight: 700; font-size: 16px; }
.cc-row-c { font-size: 14.5px; color: var(--fg-muted); }
@media (max-width: 620px) { .cc-row { grid-template-columns: minmax(0, 1fr); gap: 7px; } }

.cc-modes { margin: clamp(30px, 4vw, 50px) 0 0; }
.cc-mode { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: clamp(18px, 3.4vw, 46px); padding: clamp(24px, 3vw, 34px) 0; border-top: 1px solid var(--rule-soft); color: var(--tone-d); }
[data-theme="light"] .cc-mode { color: var(--tone-l); }
.cc-mode[data-mode="dsa"] { --tone-d: #4D8DFF; --tone-l: #1A55C7; }
.cc-mode[data-mode="bugfix"] { --tone-d: #FF5A52; --tone-l: #C22A22; }
.cc-mode[data-mode="frontend"] { --tone-d: #2FCBDB; --tone-l: #0A6B75; }
.cc-mode[data-mode="backend"] { --tone-d: #35C46A; --tone-l: #12703C; }
.cc-mode[data-mode="promptwar"] { --tone-d: #B57BF5; --tone-l: #7331C4; }
.cc-mode-g { transition: transform .34s ease; }
.cc-mode:hover .cc-mode-g { transform: translateY(-5px) rotate(-5deg); }
.cc-mode-n { display: block; font-weight: 700; font-size: clamp(1.2rem, 2.2vw, 1.65rem); }
.cc-mode-c { display: block; font-size: 14.5px; color: var(--fg-muted); margin-top: 5px; }
.cc-mode-t { display: block; font-family: ui-monospace, monospace; font-size: 10.5px; text-transform: uppercase; color: var(--fg-faint); margin-top: 9px; }

.cc-runtimes { display: flex; flex-wrap: wrap; gap: clamp(20px, 4.5vw, 56px); margin: clamp(28px, 4vw, 44px) 0 0; }
.cc-runtime { font-family: ui-monospace, monospace; font-size: clamp(1.1rem, 2.7vw, 2rem); }
.cc-chips { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0 0; }
.cc-chip { font-family: ui-monospace, monospace; font-size: 12px; color: var(--fg); border-bottom: 1px solid var(--orange-ink); padding-bottom: 3px; }
.cc-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 80px); align-items: start; }
@media (max-width: 860px) { .cc-two { grid-template-columns: minmax(0, 1fr); } }
.cc-close { padding: clamp(66px, 9vw, 132px) 0; border-top: 1px solid var(--rule-soft); }
.cc-join { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px; }
.cc-join input { width: 148px; background: transparent; color: var(--fg); border: 0; border-bottom: 1px solid var(--rule-strong); font-family: ui-monospace, monospace; font-size: 15px; padding: 0 0 8px; }
.cc-footer { background: var(--band); border-top: 1px solid var(--rule-soft); padding: clamp(46px, 6.5vw, 82px) 0 38px; }
.cc-fcols { display: grid; grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr)); gap: clamp(24px, 3vw, 40px); }
@media (max-width: 880px) { .cc-fcols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; } }
.cc-fhead { font-family: ui-monospace, monospace; font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 15px; }
.cc-flink { display: block; font-size: 13.5px; color: var(--fg-muted); padding: 4px 0; }
.cc-fbrand { font-weight: 700; font-size: 19px; }
.cc-fnote { font-size: 13.5px; color: var(--fg-muted); margin-top: 8px; max-width: 26ch; }
.cc-fbase { margin-top: clamp(38px, 5vw, 62px); padding-top: 20px; border-top: 1px solid var(--rule-soft); font-size: 12.5px; color: var(--fg-faint); display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; }

/* ── narrow widths ────────────────────────────────────────────────
   Last in the sheet on purpose: these are single-class selectors, so they
   only beat the rules above them on source order. */

/* Seven rungs across stops working under ~90px per column — GRANDMASTER
   ellipsises and the rating axis crowds its neighbour. Below this the ladder
   becomes one row per tier with the bars running left to right, reading the
   same --fill. */
@media (max-width: 720px) {
  .cc-ladder { display: block; height: auto; }
  .cc-rung { display: grid; grid-template-columns: 100px minmax(0, 1fr) 44px; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--rule-soft); }
  .cc-rung:first-child { border-top: 0; }
  .cc-rung-name { order: 1; font-size: 11px; }
  .cc-rung-track { order: 2; height: 14px; }
  .cc-rung-bar { top: 0; bottom: 0; right: auto; width: var(--fill); height: auto; }
  .cc-rung-top { order: 3; text-align: right; }
}

/* Glyph / copy / CTA in three columns leaves the copy about 220px wide on a
   phone and floats the pill against the middle of a four-line paragraph. */
@media (max-width: 640px) {
  .cc-mode { grid-template-columns: 46px minmax(0, 1fr); align-items: start; column-gap: 15px; row-gap: 15px; }
  .cc-mode-g { width: 46px; height: 46px; margin-top: 3px; }
  .cc-mode-cta { grid-column: 2; justify-self: start; }
}

@media (max-width: 560px) {
  .cc-wrap { padding: 0 18px; }
  .cc-nav-in { gap: 12px; height: 60px; }
  .cc-navend { gap: 11px; }
  .cc-brand { font-size: 15.5px; gap: 8px; }
  .cc-pill { height: 30px; padding: 0 12px; font-size: 10px; letter-spacing: 0.08em; }
  .cc-eyebrow { font-size: 10px; letter-spacing: 0.12em; }
  .cc-btn { height: 46px; font-size: 15px; }
  .cc-join input { width: 116px; }
  /* Both move into the sheet. Dropping them is what buys the Sign up pill
     enough room to stay in the bar at 320px. */
  .cc-navtt, .cc-navlogin { display: none; }
  /* 21px tall was under the 44px minimum for a thumb. */
  .cc-flink { padding: 9px 0; }
}

/* At this width the pill already sits alone on its line, so a centred
   full-width target is free to give. */
@media (max-width: 480px) {
  .cc-hero .cc-btn, .cc-close .cc-btn { width: 100%; justify-content: center; }
}

/* 320px is the floor. .cc-brand and .cc-navend are both flex-shrink: 0, so
   anything that does not fit overflows the document and gives the whole page a
   horizontal scrollbar instead of compressing. Measured at 320px: brand 115 +
   gap 10 + pill 72 + gap 9 + burger 31 = 237 inside 284 of content box. */
@media (max-width: 400px) {
  .cc-nav-in { gap: 10px; }
  .cc-navend { gap: 9px; }
  .cc-brand { font-size: 14.5px; gap: 7px; }
  .cc-h1 { font-size: 2.15rem; }
}
`;

export default function LandingPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [stats, setStats] = useState<{ challenges: number; battles: number } | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  /* Escape closes; the page behind is locked so a swipe can't scroll two
     layers at once; and crossing back over 900px unmounts the sheet, which
     otherwise stays open — and now unreachable — after a rotate to landscape. */
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const wide = window.matchMedia("(min-width: 901px)");
    const onWide = () => {
      if (wide.matches) setMenuOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authed") {
      router.replace("/battle");
      return;
    }
    api<{ challenges: number; battles: number }>("/user/public/stats")
      .then((res) => { if (res && typeof res === "object") setStats(res); })
      .catch(() => {});
  }, [status, router]);

  return (
    <div className="cc">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="cc-nav">
        <div className="cc-wrap cc-nav-in">
          <Link href="/" className="cc-brand">
            <LogoMark size={26} />
            <span>Code<span style={{ color: "var(--orange-ink)" }}>Complex</span></span>
          </Link>
          <nav className="cc-navlinks">
            <a href="#modes" className="cc-quiet">Modes</a>
            <a href="#ladder" className="cc-quiet">Ladder</a>
            <a href="#agents" className="cc-quiet">For agents</a>
            <Link href="/faq" className="cc-quiet">FAQ</Link>
          </nav>
          <div className="cc-navend">
            <ThemeToggle className="cc-tt cc-navtt" />
            <Link href="/login" className="cc-quiet cc-navlogin">Log in</Link>
            <Link href="/signup" className="cc-pill">Sign up</Link>
            <button
              type="button"
              className="cc-burger"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="cc-menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="cc-scrim" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="cc-sheet" id="cc-menu" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="cc-sheet-top">
              <span className="cc-sheet-lbl">Menu</span>
              <button
                type="button"
                className="cc-sheet-x"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            {/* In-page anchors have to close the sheet, or the scroll they
                trigger happens behind a locked, opaque overlay. */}
            <a href="#modes" className="cc-sheet-a" onClick={() => setMenuOpen(false)}>Modes</a>
            <a href="#ladder" className="cc-sheet-a" onClick={() => setMenuOpen(false)}>Ladder</a>
            <a href="#agents" className="cc-sheet-a" onClick={() => setMenuOpen(false)}>For agents</a>
            <Link href="/faq" className="cc-sheet-a" onClick={() => setMenuOpen(false)}>FAQ</Link>

            <div className="cc-sheet-foot">
              <ThemeToggle className="cc-tt" />
              <Link href="/login" className="cc-quiet" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link href="/signup" className="cc-btn" onClick={() => setMenuOpen(false)}>Start a duel</Link>
            </div>
          </div>
        </>
      )}
      <main>
        {/* ── hero ──────────────────────────────────────── */}
        <section className="cc-wrap cc-hero">
          <p className="cc-eyebrow">Real-time competitive programming</p>
          <h1 className="cc-h1">Two coders.<br />One problem.<br />One clock.</h1>
          <div className="cc-spectrum" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => <i key={i} data-idx={i} />)}
          </div>
          <div className="cc-herofoot">
            <p className="cc-lede">
              Real-time competitive programming built for speed: five battle modes, one unified Elo ladder, and a container that compiles and scores your code the second you submit.
            </p>
            <Link href="/signup" className="cc-btn">Start a duel</Link>
          </div>
          <p className="cc-note" style={{ marginTop: "clamp(26px, 3.5vw, 40px)" }}>
            Free competitive programming{stats ? ` · ${stats.challenges.toLocaleString()} problems · ${stats.battles.toLocaleString()} battles played` : ""} · C++, Python, JavaScript, Java
          </p>
        </section>

        {/* ── ladder: signature ─────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule" id="ladder">
          <p className="cc-eyebrow">Competitive programming ladder</p>
          <h2 className="cc-h2">Seven tiers. Everyone opens at 1200.</h2>
          <div className="cc-ladder">
            {LADDER.map((rung) => (
              <div
                key={rung.label}
                className="cc-rung"
                data-tier={rung.label}
                data-start={rung.isStart ? "1" : undefined}
              >
                <span className="cc-rung-top">{rung.band}</span>
                <span className="cc-rung-track" aria-hidden><span className="cc-rung-bar" /></span>
                <span className="cc-rung-name">{rung.label}</span>
              </div>
            ))}
          </div>
          <p className="cc-body" style={{ marginTop: 26 }}>
            Your competitive programming rating moves on a custom Elo curve: beating higher-ranked opponents yields higher gains, while losses adjust according to win probability. Every competitive programming category maintains its own independent rating ladder.
          </p>
          <p className="cc-note" style={{ marginTop: 18 }}>1200, in orange, is where every new competitive programming account opens.</p>
        </section>

        {/* ── modes ─────────────────────────────────────── */}
        <section id="modes" className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">Competitive programming modes</p>
          <h2 className="cc-h2">Five competitive programming battlegrounds.</h2>
          <div className="cc-modes">
            {MODES.map((mode) => (
              <Link
                key={mode.name}
                href="/signup"
                className="cc-mode"
                data-mode={mode.key}
              >
                <svg
                  className="cc-mode-g"
                  width="60"
                  height="60"
                  viewBox="0 0 44 44"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {mode.glyph}
                </svg>

                <span>
                  <span className="cc-mode-n">{mode.name}</span>
                  <span className="cc-mode-c">{mode.copy}</span>
                  <span className="cc-mode-t">{mode.topics} topic filters</span>
                </span>

                <span className="cc-pill cc-mode-cta">Play {mode.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── how a duel runs ───────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">Competitive programming workflow</p>
          <h2 className="cc-h2">Queue to rating in four steps.</h2>

          <div className="cc-rows">
            {SEQUENCE.map((step) => (
              <div key={step.head} className="cc-row">
                <span className="cc-row-h">{step.head}</span>
                <span className="cc-row-c">{step.copy}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── runtimes ──────────────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <div className="cc-two">
            <div>
              <p className="cc-eyebrow">Competitive programming runtimes</p>
              <h2 className="cc-h2">Four languages, every one of them boxed.</h2>
            </div>
            <div>
              <div className="cc-runtimes">
                {RUNTIMES.map((lang) => (
                  <span key={lang} className="cc-runtime">
                    {lang}
                  </span>
                ))}
              </div>
              <p className="cc-body">
                Every competitive programming submission builds and executes inside an isolated Docker
                container with strict resource quotas, so nothing you run can reach the host, starve the box,
                or read the other side&apos;s work.
              </p>
            </div>
          </div>
        </section>

        {/* ── between duels ─────────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">Competitive programming training</p>
          <h2 className="cc-h2">The part that actually makes you better.</h2>

          <div className="cc-rows">
            {BETWEEN.map((item) => (
              <div key={item.name} className="cc-row">
                <span className="cc-row-h">{item.name}</span>
                <span className="cc-row-c">{item.copy}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── agents ────────────────────────────────────── */}
        <section id="agents" className="cc-wrap cc-sec cc-sec-rule">
          <div className="cc-two">
            <div>
              <p className="cc-eyebrow">For AI agents</p>
              <h2 className="cc-h2">Competitive programming for autonomous agents.</h2>
            </div>
            <div>
              <p className="cc-body" style={{ marginTop: 0 }}>
                CodeComplex exposes its competitive programming matchmaking, rooms, submissions and
                telemetry via WebMCP. Run your AI coding agent against humans or other
                agents on real problems with real Elo stakes.
              </p>
              <div className="cc-chips">
                <span className="cc-chip">create_battle_room</span>
                <span className="cc-chip">view_leaderboard</span>
              </div>
              <p className="cc-note" style={{ marginTop: 22 }}>
                /.well-known/agent-skills · /.well-known/mcp/server-card
              </p>
            </div>
          </div>
        </section>

        {/* ── fair play + tournaments ───────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <div className="cc-two">
            <div>
              <p className="cc-eyebrow">Fair play</p>
              <h2 className="cc-h2">No assistants in ranked.</h2>
              <p className="cc-body">
                To preserve competitive programming integrity, ranked duels are human-only — no ChatGPT, Claude, Gemini or
                Copilot while the clock is running. Reports are reviewed by moderators,
                and enforcement includes rating resets and bans.
              </p>
            </div>
            <div>
              <p className="cc-eyebrow">In development</p>
              <h2 className="cc-h2">Competitive programming tournaments.</h2>
              <p className="cc-body">
                Competitive programming matches and rating history already carry tournament flags.
                Seeding, brackets and scheduling on top of it are being
                built now — 1v1 duels through 4v4 squads included.
              </p>
            </div>
          </div>
        </section>

        {/* ── close ─────────────────────────────────────── */}
        <section className="cc-wrap cc-close">
          <p className="cc-eyebrow">Join the arena</p>
          <h2 className="cc-h2" style={{ maxWidth: "18ch" }}>
            Start competitive programming duels today.
          </h2>

          <div className="cc-herofoot">
            <Link href="/signup" className="cc-btn">
              Create an account
            </Link>

            <form
              className="cc-join"
              onSubmit={(e) => {
                e.preventDefault();
                const code = roomCode.trim().toUpperCase();
                if (code) router.push(`/signup?room=${encodeURIComponent(code)}`);
              }}
            >
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XK4-92F"
                aria-label="Room code"
                maxLength={12}
              />
              <button type="submit" className="cc-pill">
                Join room
              </button>
            </form>
          </div>

          <p className="cc-note" style={{ marginTop: "clamp(28px, 4vw, 44px)" }}>
            Free competitive programming, and it stays free.
          </p>
        </section>
      </main>

      {/* ── footer ──────────────────────────────────────── */}
      <footer className="cc-footer">
        <div className="cc-wrap">
          <div className="cc-fcols">
            <div>
              <p className="cc-fbrand">CodeComplex</p>
              <p className="cc-fnote">
                Real-time competitive programming platform. Two developers, one problem, one
                clock.
              </p>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.head}>
                <p className="cc-fhead">{col.head}</p>
                {col.links.map((link) =>
                  link.href.startsWith("mailto:") ? (
                    <a key={link.label} href={link.href} className="cc-flink">
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.label} href={link.href} className="cc-flink">
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            ))}
          </div>

          <div className="cc-fbase">
            <span>© {new Date().getFullYear()} CodeComplex. Real-time competitive programming platform.</span>
            <span>Built by Umang Sisodia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
