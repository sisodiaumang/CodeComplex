"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ELO_TIERS } from "@/lib/theme";
import { useAuth } from "@/stores/auth-store";

/* ═══════════════════════════════════════════════════════════════
   Marketing page palette.

   Hard-coded here rather than taken from globals.css, and carrying a
   full pair of themes of its own:
   1. The shared tier tokens are unusable for this layout — bronze and
      grandmaster are literally the same hex in dark mode — and this
      page leans on tier colour to carry real information, so it needs
      seven values that stay distinct and legible in both themes.
   2. Brand orange #FF6B00/#FF7A1A fails as text on a light ground and
      behind white button text, so orange is split into a fill value
      and an ink value that darkens on paper. See --orange-fill /
      --orange-ink in the stylesheet below.
   3. globals.css has an unlayered `*{border-color}` reset that
      defeats Tailwind's border-* utilities, and cn() is a plain
      join rather than tailwind-merge. Scoped CSS with real
      specificity avoids both traps outright.

   Both themes are hand-checked, on the page surface and on the footer
   band. Dark (#0B0B0C / #101012): --fg-muted 7.3:1, --fg-faint 5.0:1,
   --orange-ink 7.3:1, tiers >=5.25:1, mode inks >=6:1. Light
   (#FAF8F4 / #F1ECE3): --fg-muted 8.2:1, --fg-faint 5.2:1,
   --orange-ink 5.2:1, tiers >=5.4:1, mode inks >=5.4:1. The CTA keeps
   the bright fill in both, with near-black ink at 7.1:1.

   Two values that look arbitrary but are not: --fg-faint must stay at
   or above #85827B (the earlier #75726B was 4.0:1 and it is used on
   10.5px mono, which needs 4.5:1), and the dot graphics use
   --orange-ink rather than the fill because the bright orange is only
   2.5:1 on paper, under even the 3:1 non-text minimum.
   ═══════════════════════════════════════════════════════════════ */

/* Each hue ships a dark-canvas value and a light-canvas twin. A single
   value cannot serve both: #E3A81B gold is 10.4:1 on near-black and
   1.9:1 on paper. Both columns are hand-checked — dark >=5.25:1 on
   #0B0B0C, light >=5.4:1 on #FAF8F4. They are applied as the custom
   properties --tone-d / --tone-l so CSS, not inline style, picks the
   one that matches [data-theme]. */
const TIER_INK: Record<string, string> = {
  Bronze: "#C1743C",
  Silver: "#A8B2BD",
  Gold: "#E3A81B",
  Platinum: "#2BB8C4",
  Diamond: "#5B85F5",
  Master: "#B06BF5",
  Grandmaster: "#FF3E6C",
};

const TIER_INK_LT: Record<string, string> = {
  Bronze: "#8A4A17",
  Silver: "#55606B",
  Gold: "#7A5A05",
  Platinum: "#0F6E78",
  Diamond: "#2A4FB8",
  Master: "#6B32A8",
  Grandmaster: "#B3123F",
};

const MODE_INK = {
  dsa: "#4D8DFF",
  bugfix: "#FF5A52",
  frontend: "#2FCBDB",
  backend: "#35C46A",
  promptwar: "#B57BF5",
} as const;

const MODE_INK_LT = {
  dsa: "#1A55C7",
  bugfix: "#C22A22",
  frontend: "#0A6B75",
  backend: "#12703C",
  promptwar: "#7331C4",
} as const;

const STARTING_RATING = 1200;

/** Ascending Bronze → Grandmaster. Bar length encodes rating floor. */
const LADDER = ELO_TIERS.map((tier, i) => {
  const next = ELO_TIERS[i + 1];
  return {
    label: tier.label,
    ink: TIER_INK[tier.label] ?? "#A8B2BD",
    inkLt: TIER_INK_LT[tier.label] ?? "#55606B",
    band: next ? `${tier.minRating}` : `${tier.minRating}+`,
    size: 26 + (i / (ELO_TIERS.length - 1)) * 74,
    isStart: tier.minRating === STARTING_RATING,
  };
});

const SPECTRUM: { d: string; l: string }[] = [
  { d: MODE_INK.dsa, l: MODE_INK_LT.dsa },
  { d: MODE_INK.bugfix, l: MODE_INK_LT.bugfix },
  { d: MODE_INK.frontend, l: MODE_INK_LT.frontend },
  { d: MODE_INK.backend, l: MODE_INK_LT.backend },
  { d: MODE_INK.promptwar, l: MODE_INK_LT.promptwar },
];

/* ── Battle modes. Topic counts are the real TOPICS_BY_MODE lengths
      from src/app/(app)/battle/page.tsx ─────────────────────────── */

type Mode = {
  name: string;
  ink: string;
  inkLt: string;
  copy: string;
  topics: number;
  glyph: ReactNode;
};

const MODES: Mode[] = [
  {
    name: "DSA",
    ink: MODE_INK.dsa,
    inkLt: MODE_INK_LT.dsa,
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
    name: "Bug Fix",
    ink: MODE_INK.bugfix,
    inkLt: MODE_INK_LT.bugfix,
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
    name: "Frontend",
    ink: MODE_INK.frontend,
    inkLt: MODE_INK_LT.frontend,
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
    name: "Backend",
    ink: MODE_INK.backend,
    inkLt: MODE_INK_LT.backend,
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
    name: "Prompt War",
    ink: MODE_INK.promptwar,
    inkLt: MODE_INK_LT.promptwar,
    copy: "Prompt engineering scored like a sport. Structured output, tool calling, RAG, agent design, safety, vision.",
    topics: 16,
    glyph: (
      <>
        <path d="M14 12 6 22l8 10M30 12l8 10-8 10" />
        <path d="M22 18l4 4-4 4-4-4z" />
      </>
    ),
  },
];

const LOBBIES = [
  {
    name: "Ranked",
    copy: "Public queue. Pick at least three topics and the backend pairs you with a similar rating, widening the search until someone fits.",
  },
  {
    name: "Versus",
    copy: "Private room with a share code. Your rules, your friends, nothing at stake.",
  },
  {
    name: "Solo",
    copy: "Any problem, any difficulty, no rating attached. Leave a side empty and fill it with a bot.",
  },
];

const SEQUENCE = [
  {
    head: "Queue up, or send a code",
    copy: "Enter public matchmaking, or open a private room and share the join code.",
  },
  {
    head: "Same problem, same second",
    copy: "Both sides get identical statements and test cases the moment the room starts.",
  },
  {
    head: "Submit and watch tests run",
    copy: "Your code builds and executes in an isolated container. You see what passed.",
  },
  {
    head: "The clock decides, rating moves",
    copy: "Elo settles before you leave the room, and the problem enters your revision queue.",
  },
];

const BETWEEN = [
  {
    name: "Revision tracker",
    copy: "Everything you solve comes back on a schedule — due today, review soon, mastered — so it sticks.",
  },
  {
    name: "Achievements",
    copy: "Unlockables graded by rarity, for the things worth doing more than once.",
  },
  {
    name: "Match history",
    copy: "Every duel you've played, with the rating swing still attached to it.",
  },
  {
    name: "Friends",
    copy: "Add the people who beat you. Challenge them back with a room code.",
  },
];

const RUNTIMES = ["C++", "Python", "JavaScript", "Java"];

const FOOTER_COLS = [
  {
    head: "Start",
    links: [
      { label: "Sign up", href: "/signup" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    head: "Learn",
    links: [
      { label: "About", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Guidelines", href: "/guidelines" },
    ],
  },
  {
    head: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    head: "Talk",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "support@codecomplex.site", href: "mailto:support@codecomplex.site" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   Scoped stylesheet
   ═══════════════════════════════════════════════════════════════ */

const CSS = `
html { background: #0B0B0C; }
html[data-theme="light"] { background: #FAF8F4; }

/* Dark is the base rather than an override: theme-store defaults to dark
   and only writes data-theme on the client, so anything keyed off
   [data-theme="dark"] would flash light on first paint. */
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
  /* Split on purpose. --orange-fill is only ever a background and always
     carries near-black ink (7.1:1 either theme). --orange-ink is the text
     and border value, and has to darken on paper: #FF7A1A reads 2.5:1
     there, which fails, while #B04A08 reads 5.2:1. */
  --orange-fill: #FF7A1A;
  --orange-hi: #FF9040;
  --orange-ink: #FF7A1A;
  --display: var(--font-heading), "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --body: var(--font-body), Inter, ui-sans-serif, system-ui, sans-serif;
  --mono: var(--font-code), "JetBrains Mono", ui-monospace, monospace;

  background: var(--ink);
  color: var(--fg);
  font-family: var(--body);
  min-height: 100vh;
  font-size: 16px;
  line-height: 1.6;
}

/* Light canvas. Warm paper rather than #FFF so the orange sits in the
   same family. Text values verified on both surfaces used here, the page
   #FAF8F4 and the footer band #F1ECE3: --fg 17.5:1 / 14.9:1,
   --fg-muted 8.2:1 / 7.4:1, --fg-faint 5.7:1 / 5.2:1. */
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

/* Deliberately no \`color: inherit\` here — \`.cc a\` is (0,1,1) and would
   outrank every single-class colour rule below it (.cc-quiet, .cc-pill,
   .cc-flink). Anchors inherit via Tailwind preflight, which is layered
   and so loses to these unlayered class rules. */
.cc a { text-decoration: none; }
.cc a:focus-visible,
.cc button:focus-visible,
.cc input:focus-visible {
  outline: 2px solid var(--orange-ink);
  outline-offset: 3px;
}
/* globals.css sets ::selection unlayered with theme tokens, which can land
   light-on-light over this dark canvas. (0,1,0) here beats its (0,0,0). */
.cc ::selection { background: var(--orange-fill); color: #0B0B0C; }

/* ── type ─────────────────────────────────────────────── */
.cc-eyebrow {
  display: inline-flex; gap: 9px; align-items: baseline;
  font-family: var(--mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.15em; text-transform: uppercase; color: var(--fg-muted);
}
.cc-eyebrow::before { content: "{"; color: var(--orange-ink); }
.cc-eyebrow::after  { content: "}"; color: var(--orange-ink); }

.cc-h1 {
  font-family: var(--display); font-weight: 700;
  font-size: clamp(2.4rem, 10.5vw, 7.8rem);
  line-height: 0.88; letter-spacing: -0.045em;
  margin: clamp(22px, 3vw, 34px) 0 0;
}
.cc-h2 {
  font-family: var(--display); font-weight: 700;
  font-size: clamp(1.85rem, 4.4vw, 3.3rem);
  line-height: 1.02; letter-spacing: -0.032em;
  margin: 16px 0 0; max-width: 22ch;
}
.cc-lede { font-size: clamp(1.05rem, 1.9vw, 1.4rem); line-height: 1.5; color: var(--fg-muted); max-width: 40ch; }
.cc-thesis {
  font-family: var(--display); font-weight: 500;
  font-size: clamp(1.35rem, 3.3vw, 2.5rem);
  line-height: 1.25; letter-spacing: -0.025em;
  margin: clamp(20px, 3vw, 34px) 0 0; max-width: 30ch;
}
.cc-body { font-size: 15.5px; color: var(--fg-muted); max-width: 56ch; margin: 20px 0 0; }
.cc-note { font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.05em; color: var(--fg-faint); }

/* ── controls ─────────────────────────────────────────── */
.cc-btn {
  display: inline-flex; align-items: center; gap: 9px;
  height: 48px; padding: 0 24px; border: 0; border-radius: 999px;
  background: var(--orange-fill); color: #0B0B0C;
  font-family: var(--display); font-weight: 700; font-size: 15.5px;
  letter-spacing: -0.01em; cursor: pointer;
  transition: background .18s ease, transform .18s ease;
}
.cc-btn:hover { background: var(--orange-hi); transform: translateY(-2px); }

.cc-pill {
  display: inline-flex; align-items: center; gap: 7px;
  height: 33px; padding: 0 15px; border-radius: 999px;
  border: 1px solid var(--rule);
  font-family: var(--mono); font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.11em; text-transform: uppercase; color: var(--fg-muted);
  transition: border-color .18s ease, color .18s ease;
}
.cc-pill:hover { color: var(--fg); border-color: var(--rule-strong); }

.cc-quiet { color: var(--fg-muted); transition: color .18s ease; }
.cc-quiet:hover { color: var(--fg); }

/* ── nav ──────────────────────────────────────────────── */
.cc-nav {
  position: sticky; top: 0; z-index: 50;
  background: var(--ink-blur);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--rule-soft);
}
.cc-nav-in { display: flex; align-items: center; justify-content: space-between; gap: 22px; height: 66px; }
.cc-brand { display: flex; align-items: center; gap: 10px; color: var(--fg); font-family: var(--display); font-weight: 700; font-size: 17px; letter-spacing: -0.02em; }
.cc-navlinks { display: flex; gap: 28px; font-size: 13.5px; }
.cc-navend { display: flex; align-items: center; gap: 18px; font-size: 13.5px; }
/* ThemeToggle keeps its own layout utilities; only colour comes from here. */
.cc-tt { color: var(--fg-muted); }
.cc-tt:hover { color: var(--fg); background: var(--rule-soft); }
@media (max-width: 900px) { .cc-navlinks { display: none; } }

/* ── hero ─────────────────────────────────────────────── */
.cc-hero { padding: clamp(48px, 8vw, 104px) 0 clamp(52px, 7vw, 96px); }
.cc-spectrum { display: flex; height: 5px; margin: clamp(30px, 4vw, 46px) 0 0; max-width: 780px; }
.cc-spectrum i { flex: 1; transform: scaleX(0); transform-origin: left; transition: transform .75s cubic-bezier(.2,.8,.2,1); background: var(--tone-d); }
.cc-go .cc-spectrum i { transform: scaleX(1); }

/* Tier and mode hues are carried as --tone-d / --tone-l custom properties on
   the element, and picked here rather than set inline, because an inline
   colour cannot respond to [data-theme]. */
[data-theme="light"] .cc-spectrum i { background: var(--tone-l); }
.cc-herofoot {
  display: flex; flex-wrap: wrap; align-items: center; gap: clamp(18px, 3vw, 40px);
  margin: clamp(30px, 4vw, 46px) 0 0;
}

/* ── ladder (signature) ───────────────────────────────── */
.cc-ladder {
  display: flex; align-items: stretch; gap: clamp(5px, 1.3vw, 15px);
  height: clamp(190px, 27vw, 300px); margin: clamp(34px, 5vw, 60px) 0 0;
}
.cc-rung { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 11px; color: var(--tone-d); }
[data-theme="light"] .cc-rung { color: var(--tone-l); }
.cc-rung-top { font-family: var(--mono); font-size: 11px; color: var(--fg-faint); }
/* Track carries the definite height, so the bar's % resolves. A percentage
   height against an auto-height flex parent would collapse to zero. */
.cc-rung-track { position: relative; flex: 1; min-height: 0; }
.cc-rung-bar {
  position: absolute; left: 0; right: 0; bottom: 0; height: 0;
  background: currentColor;
  transition: height .95s cubic-bezier(.2,.8,.2,1);
}
.cc-go .cc-rung-bar { height: var(--h); }
.cc-rung-name {
  font-family: var(--display); font-weight: 700;
  font-size: clamp(9.5px, 1.05vw, 12px);
  text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cc-rung-start { font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--orange-ink); }

/* ── formats ──────────────────────────────────────────── */
.cc-fmt { display: flex; flex-wrap: wrap; gap: clamp(26px, 5vw, 66px); margin: clamp(30px, 4vw, 48px) 0 0; }
.cc-fmt-i { display: flex; flex-direction: column; gap: 13px; }
.cc-dots { display: flex; align-items: center; gap: 7px; height: 12px; }
.cc-dots i { width: 11px; height: 11px; border-radius: 999px; background: var(--orange-ink); display: block; }
.cc-dots i.o { background: var(--fg); }
.cc-dots span { font-family: var(--mono); font-size: 10px; color: var(--fg-faint); margin: 0 4px; }
.cc-fmt-l { font-family: var(--display); font-weight: 700; font-size: 15px; letter-spacing: -0.01em; }

/* ── list rows ────────────────────────────────────────── */
.cc-rows { margin: clamp(28px, 4vw, 46px) 0 0; }
.cc-row { display: grid; grid-template-columns: minmax(130px, 200px) minmax(0, 1fr); gap: clamp(16px, 3vw, 42px); padding: 24px 0; border-top: 1px solid var(--rule-soft); }
.cc-rows .cc-row:last-child { border-bottom: 1px solid var(--rule-soft); }
.cc-row-h { font-family: var(--display); font-weight: 700; font-size: 16px; letter-spacing: -0.015em; }
.cc-row-c { font-size: 14.5px; color: var(--fg-muted); max-width: 62ch; }
@media (max-width: 620px) { .cc-row { grid-template-columns: minmax(0, 1fr); gap: 7px; } }

/* ── modes ────────────────────────────────────────────── */
.cc-modes { margin: clamp(30px, 4vw, 50px) 0 0; }
.cc-mode {
  display: grid; grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center; gap: clamp(18px, 3.4vw, 46px);
  padding: clamp(24px, 3vw, 34px) 0; border-top: 1px solid var(--rule-soft);
  color: var(--tone-d);
}
[data-theme="light"] .cc-mode { color: var(--tone-l); }
.cc-modes .cc-mode:last-child { border-bottom: 1px solid var(--rule-soft); }
.cc-mode-g { transition: transform .34s cubic-bezier(.2,.8,.2,1); }
.cc-mode:hover .cc-mode-g { transform: translateY(-5px) rotate(-5deg); }
.cc-mode-n { display: block; line-height: 1.15; font-family: var(--display); font-weight: 700; font-size: clamp(1.2rem, 2.2vw, 1.65rem); letter-spacing: -0.025em; }
.cc-mode-c { display: block; font-size: 14.5px; color: var(--fg-muted); max-width: 54ch; margin-top: 5px; }
.cc-mode-t { display: block; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint); margin-top: 9px; }
.cc-mode:hover .cc-pill { color: var(--fg); border-color: var(--rule-strong); }
@media (max-width: 780px) {
  .cc-mode { grid-template-columns: 52px minmax(0, 1fr); }
  .cc-mode-cta { grid-column: 2; justify-self: start; margin-top: 14px; }
}

/* ── runtimes ─────────────────────────────────────────── */
.cc-runtimes { display: flex; flex-wrap: wrap; align-items: baseline; gap: clamp(20px, 4.5vw, 56px); margin: clamp(28px, 4vw, 44px) 0 0; }
.cc-runtime { font-family: var(--mono); font-size: clamp(1.1rem, 2.7vw, 2rem); letter-spacing: -0.03em; }

/* ── mono chips ───────────────────────────────────────── */
.cc-chips { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0 0; }
.cc-chip { font-family: var(--mono); font-size: 12px; color: var(--fg); border-bottom: 1px solid var(--orange-ink); padding-bottom: 3px; }

/* ── two column band ──────────────────────────────────── */
.cc-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 80px); align-items: start; }
@media (max-width: 860px) { .cc-two { grid-template-columns: minmax(0, 1fr); } }

/* ── close ────────────────────────────────────────────── */
.cc-close { padding: clamp(66px, 9vw, 132px) 0; border-top: 1px solid var(--rule-soft); }
.cc-join { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px; }
.cc-join input {
  width: 148px; background: transparent; color: var(--fg);
  border: 0; border-bottom: 1px solid var(--rule-strong);
  font-family: var(--mono); font-size: 15px; letter-spacing: 0.14em;
  padding: 0 0 8px;
}
.cc-join input::placeholder { color: var(--fg-faint); letter-spacing: 0.14em; }
.cc-join input:focus { border-bottom-color: var(--orange-ink); }

/* ── footer ───────────────────────────────────────────── */
/* Sits on the same canvas as the page, lifted one step (--band) and topped
   with a hairline, so it reads as its own band in either theme without the
   hard light/dark colour break the sand version had. */
.cc-footer { background: var(--band); border-top: 1px solid var(--rule-soft); padding: clamp(46px, 6.5vw, 82px) 0 38px; }
.cc-fcols { display: grid; grid-template-columns: 1.5fr repeat(4, minmax(0, 1fr)); gap: clamp(24px, 3vw, 40px); }
@media (max-width: 880px) { .cc-fcols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; } }
.cc-fhead { font-family: var(--mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.17em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 15px; }
.cc-flink { display: block; font-size: 13.5px; color: var(--fg-muted); padding: 4px 0; transition: color .18s ease; }
.cc-flink:hover { color: var(--orange-ink); }
.cc-fbrand { font-family: var(--display); font-weight: 700; font-size: 19px; letter-spacing: -0.02em; color: var(--fg); }
.cc-fnote { font-size: 13.5px; color: var(--fg-muted); margin-top: 8px; max-width: 26ch; }
.cc-fbase { margin-top: clamp(38px, 5vw, 62px); padding-top: 20px; border-top: 1px solid var(--rule-soft); font-size: 12.5px; color: var(--fg-faint); display: flex; flex-wrap: wrap; gap: 14px; justify-content: space-between; }

@media (max-width: 660px) {
  .cc-ladder { flex-direction: column-reverse; align-items: stretch; height: auto; gap: 10px; }
  .cc-rung { flex-direction: row; align-items: center; gap: 12px; }
  .cc-rung-name { width: 104px; flex: 0 0 auto; font-size: 11px; order: -1; }
  .cc-rung-track { height: 7px; flex: 1; }
  .cc-rung-bar { right: auto; top: 0; bottom: 0; height: auto; width: 0; transition: width .95s cubic-bezier(.2,.8,.2,1); }
  .cc-go .cc-rung-bar { height: auto; width: var(--h); }
  .cc-rung-top { width: 52px; flex: 0 0 auto; text-align: right; order: 1; }
  .cc-rung-start { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .cc *, .cc *::before, .cc *::after {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
  }
  .cc-btn:hover { transform: none; }
  .cc-mode:hover .cc-mode-g { transform: none; }
}
`;

/* ═══════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [stats, setStats] = useState<{ challenges: number; battles: number } | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [go, setGo] = useState(false);
  const [stagger, setStagger] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authed") {
      router.replace("/battle");
      return;
    }
    api<{ challenges: number; battles: number }>("/user/public/stats")
      .then((res) => {
        if (res && typeof res === "object") setStats(res);
      })
      .catch(() => {});
  }, [status, router]);

  useEffect(() => {
    // globals.css zeroes transition-duration under reduced motion but not
    // transition-delay, so staggered reveals still crawl in. Kill it in JS.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStagger(false);
    }
    const frame = requestAnimationFrame(() => setGo(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const delay = (i: number) => (stagger ? `${i * 65}ms` : "0ms");

  return (
    <div className={go ? "cc cc-go" : "cc"}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── nav ─────────────────────────────────────────── */}
      <header className="cc-nav">
        <div className="cc-wrap cc-nav-in">
          <Link href="/" className="cc-brand">
            <LogoMark size={26} />
            <span>
              Code<span style={{ color: "var(--orange-ink)" }}>Complex</span>
            </span>
          </Link>

          <nav className="cc-navlinks">
            <a href="#modes" className="cc-quiet">Modes</a>
            <a href="#ladder" className="cc-quiet">Ladder</a>
            <a href="#agents" className="cc-quiet">For agents</a>
            <Link href="/faq" className="cc-quiet">FAQ</Link>
          </nav>

          <div className="cc-navend">
            {/* This page has its own palette, so the toggle recolours it via
                [data-theme] like everything else — and also sets the
                preference /faq, /login and the app shell read. Styled with a
                cc- class rather than utilities: the component drops its own
                sidebar-token colours when className is passed, and an
                unlayered class rule beats Tailwind's layered utilities. */}
            <ThemeToggle className="cc-tt" />
            <Link href="/login" className="cc-quiet">Log in</Link>
            <Link href="/signup" className="cc-pill">Sign up</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── hero ──────────────────────────────────────── */}
        <section className="cc-wrap cc-hero">
          <p className="cc-eyebrow">Real-time competitive coding</p>

          <h1 className="cc-h1">
            Two coders.
            <br />
            One problem.
            <br />
            One clock.
          </h1>

          <div className="cc-spectrum" aria-hidden>
            {SPECTRUM.map((tone, i) => (
              <i
                key={tone.d}
                style={
                  {
                    "--tone-d": tone.d,
                    "--tone-l": tone.l,
                    transitionDelay: delay(i),
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="cc-herofoot">
            <p className="cc-lede">
              Five kinds of duel, one Elo ladder, and a container that runs your
              code the second you hit submit.
            </p>
            <Link href="/signup" className="cc-btn">
              Start a duel
            </Link>
          </div>

          <p className="cc-note" style={{ marginTop: "clamp(26px, 3.5vw, 40px)" }}>
            Free to play
            {stats ? ` · ${stats.challenges.toLocaleString()} problems · ${stats.battles.toLocaleString()} battles played` : ""}
            {" · C++, Python, JavaScript, Java"}
          </p>
        </section>

        {/* ── thesis ────────────────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">What it is</p>
          <p className="cc-thesis">
            CodeComplex puts you in a room with another developer and one
            problem. You both start on the same second. Tests run the moment you
            submit, the clock decides who shipped it, and your rating moves
            before you leave the room.
          </p>
        </section>

        {/* ── ladder: signature ─────────────────────────── */}
        <section id="ladder" className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">The ladder</p>
          <h2 className="cc-h2">Seven tiers. Everyone opens at 1200.</h2>

          <div className="cc-ladder">
            {LADDER.map((rung, i) => (
              <div
                key={rung.label}
                className="cc-rung"
                style={
                  { "--tone-d": rung.ink, "--tone-l": rung.inkLt } as CSSProperties
                }
              >
                <span className="cc-rung-top">{rung.band}</span>
                <span className="cc-rung-track" aria-hidden>
                  <span
                    className="cc-rung-bar"
                    style={
                      {
                        "--h": `${rung.size}%`,
                        transitionDelay: delay(i),
                      } as CSSProperties
                    }
                  />
                </span>
                <span className="cc-rung-name">{rung.label}</span>
                {rung.isStart && <span className="cc-rung-start">You start here</span>}
              </div>
            ))}
          </div>

          <p className="cc-body">
            Rating moves on a custom Elo curve: beating someone above you is
            worth more, losing to someone below you costs more. Every mode
            carries its own number, so a Grandmaster in DSA can still be Bronze
            in Prompt War.
          </p>
        </section>

        {/* ── formats ───────────────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">Formats</p>
          <h2 className="cc-h2">One on one, or four on four.</h2>

          <div className="cc-fmt">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="cc-fmt-i">
                <span className="cc-dots" aria-hidden>
                  {Array.from({ length: n }).map((_, i) => (
                    <i key={`a${i}`} />
                  ))}
                  <span>vs</span>
                  {Array.from({ length: n }).map((_, i) => (
                    <i key={`b${i}`} className="o" />
                  ))}
                </span>
                <span className="cc-fmt-l">
                  {n === 1 ? "1v1 duel" : `${n}v${n} squad`}
                </span>
              </div>
            ))}
          </div>

          <div className="cc-rows">
            {LOBBIES.map((lobby) => (
              <div key={lobby.name} className="cc-row">
                <span className="cc-row-h">{lobby.name}</span>
                <span className="cc-row-c">{lobby.copy}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── modes ─────────────────────────────────────── */}
        <section id="modes" className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">Five modes</p>
          <h2 className="cc-h2">Five different kinds of duel.</h2>

          <div className="cc-modes">
            {MODES.map((mode) => (
              <Link
                key={mode.name}
                href="/signup"
                className="cc-mode"
                style={
                  { "--tone-d": mode.ink, "--tone-l": mode.inkLt } as CSSProperties
                }
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
          <p className="cc-eyebrow">How a duel runs</p>
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
              <p className="cc-eyebrow">Runtimes</p>
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
                Every submission builds and executes inside an isolated Docker
                container, so nothing you run can reach the host, starve the box,
                or read the other side&apos;s work. More runtimes are on the way.
              </p>
            </div>
          </div>
        </section>

        {/* ── between duels ─────────────────────────────── */}
        <section className="cc-wrap cc-sec cc-sec-rule">
          <p className="cc-eyebrow">Between duels</p>
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
              <p className="cc-eyebrow">For agents</p>
              <h2 className="cc-h2">The arena is machine-readable.</h2>
            </div>
            <div>
              <p className="cc-body" style={{ marginTop: 0 }}>
                CodeComplex registers browser tools over the Model Context
                Protocol. An agent working inside the page can open a battle room
                or read the ladder without a human clicking anything, and the
                tool manifests are published for discovery.
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
                Ranked duels are human-only — no ChatGPT, Claude, Gemini or
                Copilot while the clock is running. Reports are read by a person,
                and enforcement starts at a rating reset.
              </p>
            </div>
            <div>
              <p className="cc-eyebrow">In development</p>
              <h2 className="cc-h2">Bracketed tournaments.</h2>
              <p className="cc-body">
                Matches and rating history already carry a tournament flag end to
                end. Seeding, brackets and scheduling on top of it are being
                built now — 2v2 through 4v4 squads included.
              </p>
            </div>
          </div>
        </section>

        {/* ── close ─────────────────────────────────────── */}
        <section className="cc-wrap cc-close">
          <p className="cc-eyebrow">Your move</p>
          <h2 className="cc-h2" style={{ maxWidth: "18ch" }}>
            Pick a mode. Start the clock.
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
            Free, and it stays free.
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
                Real-time competitive coding. Two developers, one problem, one
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
            <span>© {new Date().getFullYear()} CodeComplex. All rights reserved.</span>
            <span>Built by Umang Sisodia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
