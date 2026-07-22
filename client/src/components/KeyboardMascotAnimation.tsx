"use client";

import { cn } from "@/lib/utils";

interface KeyboardMascotAnimationProps {
  active: boolean;
  pet?: { type: string; color: string } | null;
  onlyMascot?: boolean;
  opponentName?: string;
}

export default function KeyboardMascotAnimation({ active, pet, onlyMascot = false, opponentName }: KeyboardMascotAnimationProps) {
  const type = pet?.type ?? "cat";
  const color = pet?.color ?? "#FF6B00";

  const isBot = Boolean(opponentName && (opponentName.toLowerCase().includes("bot") || opponentName.toLowerCase().includes("ghost")));
  const activeState = active || isBot;

  const svgContent = (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="shrink-0 overflow-visible drop-shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
      <defs>
        <ellipse id="baseShadow" cx="40" cy="54" rx="30" ry="4" fill="rgba(0,0,0,0.15)" />
        <linearGradient id="deskGrad" x1="40" y1="49" x2="40" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-surface-3)" />
          <stop offset="100%" stopColor="var(--color-surface-2)" />
        </linearGradient>
        <linearGradient id="laptopBody" x1="40" y1="43" x2="40" y2="53" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A4E69" />
          <stop offset="100%" stopColor="#222533" />
        </linearGradient>
        <linearGradient id="screenGlow" x1="40" y1="31" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E2235" />
          <stop offset="100%" stopColor="#0F111A" />
        </linearGradient>
        <filter id="neonGlowMascot" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="screenContentGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="legendaryGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <use href="#baseShadow" />

      {/* ── MASCOT BODY & HEAD ── */}
      <g className={cn(!activeState ? "animate-mascot-thinking" : "")} style={{ transformOrigin: "40px 40px" }}>

        {/* 1. Cat */}
        {type === "cat" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill="#000" opacity="0.08" />
            {/* Tummy highlight */}
            <ellipse cx="40" cy="42" rx="8" ry="4" fill="#fff" opacity="0.15" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Ear Left */}
            <polygon points="26,14 22,4 32,11" fill={color} />
            <polygon points="27,13 24,7 30,11" fill="#FFB5C8" opacity="0.9" />
            {/* Ear Right */}
            <polygon points="54,14 58,4 48,11" fill={color} />
            <polygon points="53,13 56,7 50,11" fill="#FFB5C8" opacity="0.9" />
            {/* Face shading */}
            <ellipse cx="40" cy="25" rx="9" ry="7" fill="#fff" opacity="0.1" />
            {/* Eyes */}
            <ellipse cx="33" cy="20" rx="3" ry="3.5" fill="#fff" />
            <ellipse cx="33" cy="20.5" rx="1.5" ry="2.5" fill="#222" />
            <circle cx="32.5" cy="19" r="0.8" fill="#fff" />
            <ellipse cx="47" cy="20" rx="3" ry="3.5" fill="#fff" />
            <ellipse cx="47" cy="20.5" rx="1.5" ry="2.5" fill="#222" />
            <circle cx="46.5" cy="19" r="0.8" fill="#fff" />
            {/* Nose */}
            <path d="M38.5 25 L40 27 L41.5 25 Z" fill="#FF9EBE" />
            {/* Mouth */}
            <path d="M38 27.5 Q40 29 42 27.5" stroke="#222" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Whiskers */}
            <line x1="22" y1="24" x2="34" y2="25.5" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="22" y1="26" x2="34" y2="26.5" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="58" y1="24" x2="46" y2="25.5" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="58" y1="26" x2="46" y2="26.5" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            {/* Cheek blush */}
            <ellipse cx="30" cy="26" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.35" />
            <ellipse cx="50" cy="26" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.35" />
          </g>
        )}

        {/* 2. Dog */}
        {type === "dog" && (
          <g>
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            <ellipse cx="40" cy="42" rx="9" ry="4" fill="#fff" opacity="0.12" />
            {/* Floppy ears */}
            <path d="M26 14 C18 16 15 26 20 32 C22 28 24 20 28 17Z" fill="#8B5E3C" />
            <path d="M54 14 C62 16 65 26 60 32 C58 28 56 20 52 17Z" fill="#8B5E3C" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Snout */}
            <ellipse cx="40" cy="27" rx="7" ry="5" fill={color} />
            <ellipse cx="40" cy="27" rx="7" ry="5" fill="#fff" opacity="0.2" />
            {/* Eyes */}
            <circle cx="33" cy="20" r="3" fill="#fff" />
            <circle cx="33" cy="20.5" r="1.8" fill="#3D2B1F" />
            <circle cx="32.4" cy="19.5" r="0.7" fill="#fff" />
            <circle cx="47" cy="20" r="3" fill="#fff" />
            <circle cx="47" cy="20.5" r="1.8" fill="#3D2B1F" />
            <circle cx="46.4" cy="19.5" r="0.7" fill="#fff" />
            {/* Nose */}
            <ellipse cx="40" cy="25.5" rx="3.5" ry="2.5" fill="#222" />
            <ellipse cx="39" cy="24.8" rx="1" ry="0.6" fill="#fff" opacity="0.5" />
            {/* Mouth & tongue */}
            <path d="M37 27.5 Q40 29.5 43 27.5" stroke="#222" strokeWidth="0.8" fill="none" />
            <ellipse cx="40" cy="30" rx="2.5" ry="2" fill="#FF5E6C" />
            <path d="M38 30 L42 30" stroke="#FF3D50" strokeWidth="0.5" />
            {/* Cheeks */}
            <ellipse cx="30" cy="26" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.3" />
            <ellipse cx="50" cy="26" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.3" />
          </g>
        )}

        {/* 3. Panda */}
        {type === "panda" && (
          <g>
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill="#fff" />
            <ellipse cx="40" cy="42" rx="9" ry="4" fill="#ddd" opacity="0.3" />
            {/* Ears */}
            <circle cx="27" cy="12" r="6" fill="#222" />
            <circle cx="53" cy="12" r="6" fill="#222" />
            {/* Head */}
            <ellipse cx="40" cy="23" rx="13" ry="12" fill="#fff" />
            {/* Eye patches */}
            <ellipse cx="33" cy="20" rx="5" ry="5.5" fill="#222" transform="rotate(-15 33 20)" />
            <ellipse cx="47" cy="20" rx="5" ry="5.5" fill="#222" transform="rotate(15 47 20)" />
            {/* Eyes */}
            <circle cx="33" cy="20" r="2.5" fill="#fff" />
            <circle cx="33" cy="20.3" r="1.5" fill="#111" />
            <circle cx="32.4" cy="19.5" r="0.6" fill="#fff" />
            <circle cx="47" cy="20" r="2.5" fill="#fff" />
            <circle cx="47" cy="20.3" r="1.5" fill="#111" />
            <circle cx="46.4" cy="19.5" r="0.6" fill="#fff" />
            {/* Snout */}
            <ellipse cx="40" cy="26" rx="5" ry="3.5" fill="#f5f5f5" />
            {/* Nose */}
            <ellipse cx="40" cy="24.5" rx="2" ry="1.5" fill="#222" />
            <ellipse cx="39.3" cy="24" rx="0.7" ry="0.4" fill="#555" opacity="0.5" />
            {/* Mouth */}
            <path d="M38 26.5 Q40 28.5 42 26.5" stroke="#222" strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* 4. Crab */}
        {type === "crab" && (
          <g>
            {/* Body shell */}
            <ellipse cx="40" cy="36" rx="14" ry="10" fill={color} />
            <ellipse cx="40" cy="34" rx="11" ry="7" fill={color} />
            <ellipse cx="40" cy="34" rx="11" ry="7" fill="#fff" opacity="0.12" />
            {/* Shell segments */}
            <path d="M30 34 Q40 30 50 34" stroke="#000" strokeWidth="0.7" fill="none" opacity="0.2" />
            <path d="M32 38 Q40 35 48 38" stroke="#000" strokeWidth="0.7" fill="none" opacity="0.2" />
            {/* Left legs */}
            <path d="M26 34 Q18 30 14 28" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M26 37 Q17 35 13 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M26 40 Q18 40 15 42" stroke={color} strokeWidth="2" strokeLinecap="round" />
            {/* Right legs */}
            <path d="M54 34 Q62 30 66 28" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M54 37 Q63 35 67 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M54 40 Q62 40 65 42" stroke={color} strokeWidth="2" strokeLinecap="round" />
            {/* Left claw */}
            <path d="M26 32 Q12 24 10 18" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="9" cy="16" rx="4" ry="3" fill={color} transform="rotate(-20 9 16)" />
            {/* Right claw */}
            <path d="M54 32 Q68 24 70 18" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="71" cy="16" rx="4" ry="3" fill={color} transform="rotate(20 71 16)" />
            {/* Eye stalks */}
            <line x1="35" y1="27" x2="33" y2="20" stroke={color} strokeWidth="2" />
            <circle cx="33" cy="18" r="3.5" fill="#fff" />
            <circle cx="33" cy="18.3" r="2" fill="#111" />
            <circle cx="32.3" cy="17.5" r="0.7" fill="#fff" />
            <line x1="45" y1="27" x2="47" y2="20" stroke={color} strokeWidth="2" />
            <circle cx="47" cy="18" r="3.5" fill="#fff" />
            <circle cx="47" cy="18.3" r="2" fill="#111" />
            <circle cx="46.3" cy="17.5" r="0.7" fill="#fff" />
          </g>
        )}

        {/* 5. Octopus */}
        {type === "octopus" && (
          <g>
            {/* Tentacles */}
            <path d="M28 38 Q20 42 18 48" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" className="animate-tentacle-wave" />
            <path d="M33 40 Q28 46 27 52" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" className="animate-tentacle-wave" style={{ animationDelay: "0.1s" }} />
            <path d="M52 38 Q60 42 62 48" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" className="animate-tentacle-wave" style={{ animationDelay: "0.2s" }} />
            <path d="M47 40 Q52 46 53 52" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" className="animate-tentacle-wave" style={{ animationDelay: "0.15s" }} />
            {/* Body */}
            <ellipse cx="40" cy="30" rx="15" ry="14" fill={color} />
            <ellipse cx="40" cy="26" rx="10" ry="8" fill="#fff" opacity="0.12" />
            {/* Texture dots */}
            <circle cx="35" cy="28" r="1.5" fill="#fff" opacity="0.15" />
            <circle cx="45" cy="28" r="1.5" fill="#fff" opacity="0.15" />
            <circle cx="40" cy="32" r="1.5" fill="#fff" opacity="0.15" />
            {/* Eyes */}
            <circle cx="33.5" cy="22" r="4" fill="#fff" />
            <circle cx="33.5" cy="22.5" r="2.5" fill="#111" />
            <circle cx="32.6" cy="21.3" r="1" fill="#fff" />
            <circle cx="46.5" cy="22" r="4" fill="#fff" />
            <circle cx="46.5" cy="22.5" r="2.5" fill="#111" />
            <circle cx="45.6" cy="21.3" r="1" fill="#fff" />
            {/* Smile */}
            <path d="M36 28 Q40 31 44 28" stroke="#fff" strokeWidth="1" fill="none" opacity="0.5" />
          </g>
        )}

        {/* 6. Frog */}
        {type === "frog" && (
          <g>
            {/* Body */}
            <ellipse cx="40" cy="39" rx="16" ry="9" fill={color} />
            <ellipse cx="40" cy="39" rx="10" ry="6" fill="#fff" opacity="0.15" />
            {/* Head */}
            <ellipse cx="40" cy="25" rx="14" ry="10" fill={color} />
            {/* Eye bumps */}
            <circle cx="30" cy="17" r="6.5" fill={color} />
            <circle cx="50" cy="17" r="6.5" fill={color} />
            {/* Eyes */}
            <circle cx="30" cy="16.5" r="4.5" fill="#fff" />
            <circle cx="30" cy="17" r="2.8" fill="#111" />
            <circle cx="29" cy="15.8" r="1.1" fill="#fff" />
            <circle cx="50" cy="16.5" r="4.5" fill="#fff" />
            <circle cx="50" cy="17" r="2.8" fill="#111" />
            <circle cx="49" cy="15.8" r="1.1" fill="#fff" />
            {/* Nostrils */}
            <ellipse cx="37.5" cy="24.5" rx="1.2" ry="0.8" fill="#000" opacity="0.3" />
            <ellipse cx="42.5" cy="24.5" rx="1.2" ry="0.8" fill="#000" opacity="0.3" />
            {/* Wide smile */}
            <path d="M30 28 Q40 34 50 28" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
            {/* Cheek blush */}
            <ellipse cx="29" cy="25" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.3" />
            <ellipse cx="51" cy="25" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.3" />
          </g>
        )}

        {/* 7. Hamster */}
        {type === "hamster" && (
          <g>
            {/* Body */}
            <ellipse cx="40" cy="38" rx="15" ry="10" fill={color} />
            <ellipse cx="40" cy="38" rx="9" ry="6" fill="#fff" opacity="0.15" />
            {/* Chubby cheek pouches */}
            <ellipse cx="25" cy="24" rx="8" ry="7" fill={color} />
            <ellipse cx="55" cy="24" rx="8" ry="7" fill={color} />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="12" ry="11" fill={color} />
            {/* Ears */}
            <circle cx="28.5" cy="12.5" r="5" fill="#E6A15C" />
            <circle cx="28.5" cy="12.5" r="3" fill="#FFB5C8" opacity="0.8" />
            <circle cx="51.5" cy="12.5" r="5" fill="#E6A15C" />
            <circle cx="51.5" cy="12.5" r="3" fill="#FFB5C8" opacity="0.8" />
            {/* Cheek blush */}
            <ellipse cx="27" cy="24" rx="5" ry="4" fill="#FFB5C8" opacity="0.45" />
            <ellipse cx="53" cy="24" rx="5" ry="4" fill="#FFB5C8" opacity="0.45" />
            {/* Eyes */}
            <circle cx="34" cy="20" r="2.8" fill="#fff" />
            <circle cx="34" cy="20.3" r="1.8" fill="#222" />
            <circle cx="33.3" cy="19.4" r="0.7" fill="#fff" />
            <circle cx="46" cy="20" r="2.8" fill="#fff" />
            <circle cx="46" cy="20.3" r="1.8" fill="#222" />
            <circle cx="45.3" cy="19.4" r="0.7" fill="#fff" />
            {/* Tiny nose */}
            <ellipse cx="40" cy="24" rx="1.5" ry="1" fill="#FF8CA0" />
            {/* Buck teeth */}
            <rect x="38.5" y="25.5" width="1.5" height="2.5" rx="0.5" fill="#fff" />
            <rect x="40.5" y="25.5" width="1.5" height="2.5" rx="0.5" fill="#fff" />
          </g>
        )}

        {/* 8. Bunny */}
        {type === "bunny" && (
          <g>
            {/* Body */}
            <ellipse cx="40" cy="39" rx="14" ry="9" fill={color} />
            <ellipse cx="40" cy="39" rx="8" ry="5" fill="#fff" opacity="0.2" />
            {/* Long ears */}
            <path d="M31 15 C28 2 24 -4 26 -8 C28 -4 30 4 32 12Z" fill={color} className="animate-ear-wiggle" style={{ transformOrigin: "31px 15px" }} />
            <ellipse cx="29" cy="3" rx="2.5" ry="6" fill="#FFB5C8" opacity="0.8" className="animate-ear-wiggle" style={{ transformOrigin: "31px 15px" }} />
            <path d="M49 15 C52 2 56 -4 54 -8 C52 -4 50 4 48 12Z" fill={color} className="animate-ear-wiggle-alt" style={{ transformOrigin: "49px 15px" }} />
            <ellipse cx="51" cy="3" rx="2.5" ry="6" fill="#FFB5C8" opacity="0.8" className="animate-ear-wiggle-alt" style={{ transformOrigin: "49px 15px" }} />
            {/* Head */}
            <ellipse cx="40" cy="23" rx="12" ry="11" fill={color} />
            {/* Eyes */}
            <circle cx="34" cy="21" r="3" fill="#fff" />
            <circle cx="34" cy="21.3" r="1.8" fill="#7B2D8B" />
            <circle cx="33.3" cy="20.4" r="0.7" fill="#fff" />
            <circle cx="46" cy="21" r="3" fill="#fff" />
            <circle cx="46" cy="21.3" r="1.8" fill="#7B2D8B" />
            <circle cx="45.3" cy="20.4" r="0.7" fill="#fff" />
            {/* Nose */}
            <ellipse cx="40" cy="25" rx="2" ry="1.5" fill="#FFB5C8" />
            {/* Mouth */}
            <path d="M38.5 26.5 Q40 28 41.5 26.5" stroke="#ccc" strokeWidth="0.8" fill="none" />
            {/* Cheeks */}
            <ellipse cx="31" cy="25" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.35" />
            <ellipse cx="49" cy="25" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.35" />
          </g>
        )}

        {/* 9. Turtle */}
        {type === "turtle" && (
          <g>
            {/* Shell */}
            <ellipse cx="40" cy="37" rx="17" ry="12" fill="#2D6A27" />
            <ellipse cx="40" cy="36" rx="15" ry="10" fill="#3A8A32" />
            {/* Shell pattern */}
            <path d="M33 28 L40 24 L47 28 L47 36 L40 40 L33 36 Z" fill="#2D6A27" opacity="0.6" />
            <path d="M26 32 L33 28 L33 36 L26 40Z" fill="#2D6A27" opacity="0.4" />
            <path d="M54 32 L47 28 L47 36 L54 40Z" fill="#2D6A27" opacity="0.4" />
            {/* Head poking out */}
            <ellipse cx="40" cy="22" rx="10" ry="9" fill={color} />
            {/* Shell neck */}
            <rect x="35" y="26" width="10" height="6" rx="3" fill={color} />
            {/* Eyes */}
            <circle cx="35" cy="20" r="2.5" fill="#fff" />
            <circle cx="35" cy="20.3" r="1.5" fill="#2D4A1A" />
            <circle cx="34.4" cy="19.6" r="0.6" fill="#fff" />
            <circle cx="45" cy="20" r="2.5" fill="#fff" />
            <circle cx="45" cy="20.3" r="1.5" fill="#2D4A1A" />
            <circle cx="44.4" cy="19.6" r="0.6" fill="#fff" />
            {/* Relaxed smile */}
            <path d="M37 24 Q40 26 43 24" stroke="#2D4A1A" strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* 10. Koala */}
        {type === "koala" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            <ellipse cx="40" cy="42" rx="9" ry="4" fill="#fff" opacity="0.12" />
            {/* Large fluffy ears */}
            <circle cx="25" cy="12" r="9" fill={color} />
            <circle cx="25" cy="12" r="6.5" fill="#C8D0D8" opacity="0.9" />
            <circle cx="55" cy="12" r="9" fill={color} />
            <circle cx="55" cy="12" r="6.5" fill="#C8D0D8" opacity="0.9" />
            {/* Head */}
            <ellipse cx="40" cy="23" rx="13" ry="12" fill={color} />
            {/* Large flat nose */}
            <ellipse cx="40" cy="25" rx="5" ry="3.5" fill="#222" />
            <ellipse cx="38.8" cy="24.2" rx="1.5" ry="1" fill="#555" opacity="0.5" />
            {/* Eyes */}
            <circle cx="33" cy="20" r="2.8" fill="#fff" />
            <circle cx="33" cy="20.3" r="1.7" fill="#222" />
            <circle cx="32.3" cy="19.4" r="0.7" fill="#fff" />
            <circle cx="47" cy="20" r="2.8" fill="#fff" />
            <circle cx="47" cy="20.3" r="1.7" fill="#222" />
            <circle cx="46.3" cy="19.4" r="0.7" fill="#fff" />
            {/* Sleepy half-lids */}
            <path d="M30.5 18.5 Q33 17 35.5 18.5" stroke="#222" strokeWidth="1.2" fill="none" />
            <path d="M44.5 18.5 Q47 17 49.5 18.5" stroke="#222" strokeWidth="1.2" fill="none" />
            {/* Mouth */}
            <path d="M38 27.5 Q40 29 42 27.5" stroke="#555" strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* 11. Fox */}
        {type === "fox" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* White chest */}
            <ellipse cx="40" cy="41" rx="8" ry="5" fill="#fff" opacity="0.4" />
            {/* Pointed ears */}
            <polygon points="26,14 18,0 32,10" fill={color} />
            <polygon points="27,13 22,3 30,10" fill="#fff" opacity="0.8" />
            <polygon points="54,14 62,0 48,10" fill={color} />
            <polygon points="53,13 58,3 50,10" fill="#fff" opacity="0.8" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* White face lower half */}
            <path d="M27 24 C27 27 33 32 40 32 C47 32 53 27 53 24Z" fill="#fff" opacity="0.9" />
            {/* Eyes */}
            <ellipse cx="33" cy="20" rx="3" ry="3.5" fill="#fff" />
            <ellipse cx="33" cy="20.5" rx="1.5" ry="2.5" fill="#2B1D0E" />
            <circle cx="32.4" cy="19.2" r="0.8" fill="#fff" />
            <ellipse cx="47" cy="20" rx="3" ry="3.5" fill="#fff" />
            <ellipse cx="47" cy="20.5" rx="1.5" ry="2.5" fill="#2B1D0E" />
            <circle cx="46.4" cy="19.2" r="0.8" fill="#fff" />
            {/* Sly eyebrow */}
            <path d="M30.5 17 Q33 15.5 35.5 17" stroke="#2B1D0E" strokeWidth="1" fill="none" />
            <path d="M44.5 17 Q47 15.5 49.5 17" stroke="#2B1D0E" strokeWidth="1" fill="none" />
            {/* Nose */}
            <ellipse cx="40" cy="26" rx="2.5" ry="1.8" fill="#222" />
            {/* Whiskers */}
            <line x1="22" y1="26" x2="34" y2="26.5" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
            <line x1="22" y1="28" x2="34" y2="28" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
            <line x1="58" y1="26" x2="46" y2="26.5" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
            <line x1="58" y1="28" x2="46" y2="28" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
          </g>
        )}

        {/* 12. Owl */}
        {type === "owl" && (
          <g>
            {/* Body */}
            <ellipse cx="40" cy="38" rx="14" ry="10" fill={color} />
            {/* Wing hints */}
            <path d="M26 36 C20 34 18 40 22 44" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M54 36 C60 34 62 40 58 44" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Ear tufts */}
            <polygon points="30,12 26,4 34,8" fill={color} />
            <polygon points="50,12 54,4 46,8" fill={color} />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Facial disc */}
            <ellipse cx="40" cy="23" rx="11" ry="10" fill="#C8AD7F" opacity="0.4" />
            {/* Large eyes with rings */}
            <circle cx="33" cy="20" r="5.5" fill="#fff" stroke="#6F4E37" strokeWidth="1.5" />
            <circle cx="33" cy="20" r="3.5" fill="#E8A020" />
            <circle cx="33" cy="20.3" r="2" fill="#111" />
            <circle cx="32.1" cy="19.1" r="0.8" fill="#fff" />
            <circle cx="47" cy="20" r="5.5" fill="#fff" stroke="#6F4E37" strokeWidth="1.5" />
            <circle cx="47" cy="20" r="3.5" fill="#E8A020" />
            <circle cx="47" cy="20.3" r="2" fill="#111" />
            <circle cx="46.1" cy="19.1" r="0.8" fill="#fff" />
            {/* Bridge between eyes */}
            <line x1="38.5" y1="20" x2="41.5" y2="20" stroke="#6F4E37" strokeWidth="0.5" />
            {/* Hooked beak */}
            <path d="M37 24 L40 28 L43 24 Q40 22 37 24Z" fill="#E8A020" />
          </g>
        )}

        {/* 13. Squirrel */}
        {type === "squirrel" && (
          <g>
            {/* Fluffy tail behind */}
            <path d="M55 44 C65 36 72 24 64 16 C58 10 50 18 52 30 C54 38 56 42 55 44Z" fill={color} opacity="0.7" />
            <path d="M55 44 C64 37 69 26 63 19 C58 14 52 20 53 30 C54 37 55 42 55 44Z" fill="#fff" opacity="0.2" />
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L58 46 C58 42 56 36 51 36 C48 33 30 33 27 36Z" fill={color} />
            {/* Pointy ears */}
            <polygon points="27,14 22,3 32,11" fill={color} />
            <polygon points="28,13 25,6 31,11" fill="#FFB5C8" opacity="0.7" />
            <polygon points="53,14 58,3 48,11" fill={color} />
            <polygon points="52,13 55,6 49,11" fill="#FFB5C8" opacity="0.7" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Chubby cheeks */}
            <ellipse cx="29" cy="26" rx="5" ry="4" fill={color} />
            <ellipse cx="51" cy="26" rx="5" ry="4" fill={color} />
            <ellipse cx="29" cy="26" rx="4" ry="3" fill="#FFB5C8" opacity="0.3" />
            <ellipse cx="51" cy="26" rx="4" ry="3" fill="#FFB5C8" opacity="0.3" />
            {/* Eyes */}
            <circle cx="34" cy="20" r="2.8" fill="#fff" />
            <circle cx="34" cy="20.3" r="1.7" fill="#222" />
            <circle cx="33.3" cy="19.4" r="0.7" fill="#fff" />
            <circle cx="46" cy="20" r="2.8" fill="#fff" />
            <circle cx="46" cy="20.3" r="1.7" fill="#222" />
            <circle cx="45.3" cy="19.4" r="0.7" fill="#fff" />
            {/* Nose */}
            <ellipse cx="40" cy="24.5" rx="1.8" ry="1.3" fill="#FF8CA0" />
            {/* Acorn held in paws */}
            <ellipse cx="40" cy="35" rx="3" ry="3.5" fill="#8B5E3C" />
            <rect x="38" y="31" width="4" height="2" rx="1" fill="#5A3D1A" />
          </g>
        )}

        {/* 14. Badger */}
        {type === "badger" && (
          <g>
            {/* Body - stocky */}
            <ellipse cx="40" cy="39" rx="16" ry="9" fill={color} />
            {/* Body stripes */}
            <ellipse cx="40" cy="39" rx="8" ry="7" fill="#fff" opacity="0.2" />
            {/* Head */}
            <ellipse cx="40" cy="23" rx="13" ry="12" fill={color} />
            {/* White forehead stripe */}
            <path d="M40 10 C37 10 37 34 40 34 C43 34 43 10 40 10Z" fill="#fff" opacity="0.85" />
            {/* Dark face mask */}
            <ellipse cx="33" cy="22" rx="5" ry="4.5" fill="#222" />
            <ellipse cx="47" cy="22" rx="5" ry="4.5" fill="#222" />
            {/* Eyes */}
            <circle cx="33" cy="21" r="2.5" fill="#fff" />
            <circle cx="33" cy="21.3" r="1.5" fill="#111" />
            <circle cx="32.4" cy="20.5" r="0.6" fill="#fff" />
            <circle cx="47" cy="21" r="2.5" fill="#fff" />
            <circle cx="47" cy="21.3" r="1.5" fill="#111" />
            <circle cx="46.4" cy="20.5" r="0.6" fill="#fff" />
            {/* Wide snout */}
            <ellipse cx="40" cy="26" rx="5" ry="3.5" fill="#888" />
            <ellipse cx="40" cy="25" rx="2.5" ry="1.8" fill="#222" />
            {/* Mouth */}
            <path d="M37.5 28 Q40 29.5 42.5 28" stroke="#444" strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* 15. Whale */}
        {type === "whale" && (
          <g>
            {/* Tail fin */}
            <path d="M58 40 Q70 36 72 30 Q66 32 62 36Z" fill={color} />
            {/* Body */}
            <ellipse cx="38" cy="34" rx="20" ry="13" fill={color} />
            {/* Belly */}
            <ellipse cx="38" cy="36" rx="13" ry="8" fill="#fff" opacity="0.25" />
            {/* Dorsal fin */}
            <path d="M42 22 L46 12 L50 22Z" fill={color} />
            <path d="M42 22 L46 14 L50 22Z" fill="#000" opacity="0.12" />
            {/* Head */}
            <ellipse cx="28" cy="30" rx="12" ry="11" fill={color} />
            {/* Eye */}
            <circle cx="24" cy="26" r="3" fill="#fff" />
            <circle cx="24" cy="26.3" r="1.8" fill="#222" />
            <circle cx="23.3" cy="25.5" r="0.7" fill="#fff" />
            {/* Smile */}
            <path d="M20 32 Q26 37 32 33" stroke="#fff" strokeWidth="1" fill="none" opacity="0.6" />
            {/* Water spout */}
            <path d="M22 18 Q20 10 18 7 M22 18 Q24 9 27 6" stroke="#6CF" strokeWidth="1.5" fill="none" strokeLinecap="round" className="animate-water-spout" />
            <ellipse cx="22" cy="18" rx="2" ry="1" fill="#6CF" opacity="0.4" />
          </g>
        )}

        {/* 16. Sloth */}
        {type === "sloth" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Arms hanging */}
            <path d="M22 38 Q15 30 12 22" stroke={color} strokeWidth="5" strokeLinecap="round" />
            <path d="M58 38 Q65 30 68 22" stroke={color} strokeWidth="5" strokeLinecap="round" />
            {/* Long curved claws left */}
            <path d="M12 22 Q8 18 9 14" stroke="#8D5B3E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M12 22 Q7 20 8 16" stroke="#8D5B3E" strokeWidth="2.5" strokeLinecap="round" />
            {/* Long curved claws right */}
            <path d="M68 22 Q72 18 71 14" stroke="#8D5B3E" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M68 22 Q73 20 72 16" stroke="#8D5B3E" strokeWidth="2.5" strokeLinecap="round" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Eye mask */}
            <ellipse cx="33" cy="21" rx="4.5" ry="3" fill="#8D5B3E" opacity="0.5" />
            <ellipse cx="47" cy="21" rx="4.5" ry="3" fill="#8D5B3E" opacity="0.5" />
            {/* Half-closed sleepy eyes */}
            <circle cx="33" cy="21" r="2.5" fill="#fff" />
            <circle cx="33" cy="22" r="2" fill="#222" />
            <circle cx="32.3" cy="21" r="0.7" fill="#fff" />
            <path d="M30.5 19.5 Q33 18 35.5 19.5" stroke="#5A3D1A" strokeWidth="1.5" fill="none" />
            <circle cx="47" cy="21" r="2.5" fill="#fff" />
            <circle cx="47" cy="22" r="2" fill="#222" />
            <circle cx="46.3" cy="21" r="0.7" fill="#fff" />
            <path d="M44.5 19.5 Q47 18 49.5 19.5" stroke="#5A3D1A" strokeWidth="1.5" fill="none" />
            {/* Slow smile */}
            <path d="M37 26.5 Q40 29 43 26.5" stroke="#5A3D1A" strokeWidth="1" fill="none" />
            {/* Nose */}
            <ellipse cx="40" cy="25" rx="2" ry="1.4" fill="#8D5B3E" />
          </g>
        )}

        {/* 17. Dino */}
        {type === "dino" && (
          <g>
            {/* Body */}
            <ellipse cx="40" cy="38" rx="15" ry="10" fill={color} />
            {/* Belly scales */}
            <ellipse cx="40" cy="39" rx="9" ry="6" fill="#fff" opacity="0.18" />
            {/* Spine spikes */}
            <polygon points="33,10 30,3 36,8" fill="#FFBE0B" />
            <polygon points="40,9 37,2 43,7" fill="#FFBE0B" />
            <polygon points="47,10 50,3 44,8" fill="#FFBE0B" />
            {/* Head */}
            <ellipse cx="40" cy="23" rx="14" ry="12" fill={color} />
            {/* Scale texture */}
            <ellipse cx="33" cy="20" rx="2.5" ry="2" fill="#000" opacity="0.07" />
            <ellipse cx="47" cy="20" rx="2.5" ry="2" fill="#000" opacity="0.07" />
            {/* Eyes */}
            <circle cx="33" cy="19.5" r="3" fill="#FFBE0B" />
            <circle cx="33" cy="19.8" r="1.8" fill="#111" />
            <circle cx="32.3" cy="18.8" r="0.7" fill="#fff" />
            <circle cx="47" cy="19.5" r="3" fill="#FFBE0B" />
            <circle cx="47" cy="19.8" r="1.8" fill="#111" />
            <circle cx="46.3" cy="18.8" r="0.7" fill="#fff" />
            {/* Toothy grin */}
            <path d="M30 26 Q40 32 50 26" stroke={color} strokeWidth="0.5" fill="#fff" />
            <line x1="33" y1="26" x2="33" y2="28.5" stroke="#ccc" strokeWidth="0.8" />
            <line x1="36" y1="27" x2="36" y2="29.5" stroke="#ccc" strokeWidth="0.8" />
            <line x1="40" y1="28" x2="40" y2="30" stroke="#ccc" strokeWidth="0.8" />
            <line x1="44" y1="27" x2="44" y2="29.5" stroke="#ccc" strokeWidth="0.8" />
            <line x1="47" y1="26" x2="47" y2="28.5" stroke="#ccc" strokeWidth="0.8" />
          </g>
        )}

        {/* 18. Otter */}
        {type === "otter" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Belly */}
            <ellipse cx="40" cy="41" rx="8" ry="5" fill="#D4956A" opacity="0.6" />
            {/* Small ears */}
            <circle cx="29" cy="12" r="4" fill={color} />
            <circle cx="29" cy="12" r="2.5" fill="#D4956A" opacity="0.7" />
            <circle cx="51" cy="12" r="4" fill={color} />
            <circle cx="51" cy="12" r="2.5" fill="#D4956A" opacity="0.7" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Lighter face */}
            <ellipse cx="40" cy="25" rx="8" ry="7" fill="#D4956A" opacity="0.45" />
            {/* Eyes */}
            <circle cx="33.5" cy="19.5" r="2.8" fill="#fff" />
            <circle cx="33.5" cy="19.8" r="1.7" fill="#222" />
            <circle cx="32.8" cy="19" r="0.7" fill="#fff" />
            <circle cx="46.5" cy="19.5" r="2.8" fill="#fff" />
            <circle cx="46.5" cy="19.8" r="1.7" fill="#222" />
            <circle cx="45.8" cy="19" r="0.7" fill="#fff" />
            {/* Round nose */}
            <ellipse cx="40" cy="24.5" rx="3" ry="2" fill="#222" />
            <ellipse cx="39" cy="23.8" rx="1" ry="0.6" fill="#555" opacity="0.5" />
            {/* Whiskers */}
            <line x1="26" y1="25" x2="35" y2="25.5" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="26" y1="27" x2="35" y2="27" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="54" y1="25" x2="45" y2="25.5" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="54" y1="27" x2="45" y2="27" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            {/* Happy smile */}
            <path d="M37 27.5 Q40 30 43 27.5" stroke="#222" strokeWidth="0.9" fill="none" />
          </g>
        )}

        {/* 19. Monkey */}
        {type === "monkey" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Big round ears */}
            <circle cx="25" cy="18" r="7.5" fill={color} />
            <circle cx="25" cy="18" r="5" fill="#FAD2B0" opacity="0.9" />
            <circle cx="55" cy="18" r="7.5" fill={color} />
            <circle cx="55" cy="18" r="5" fill="#FAD2B0" opacity="0.9" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Light face oval */}
            <ellipse cx="40" cy="24" rx="9" ry="8" fill="#FAD2B0" opacity="0.85" />
            {/* Eyes */}
            <circle cx="34" cy="20" r="3" fill="#fff" />
            <circle cx="34" cy="20.3" r="1.9" fill="#222" />
            <circle cx="33.2" cy="19.3" r="0.8" fill="#fff" />
            <circle cx="46" cy="20" r="3" fill="#fff" />
            <circle cx="46" cy="20.3" r="1.9" fill="#222" />
            <circle cx="45.2" cy="19.3" r="0.8" fill="#fff" />
            {/* Nostrils */}
            <ellipse cx="38" cy="25" rx="1.2" ry="0.8" fill="#8B5E3C" opacity="0.6" />
            <ellipse cx="42" cy="25" rx="1.2" ry="0.8" fill="#8B5E3C" opacity="0.6" />
            {/* Grin */}
            <path d="M35 28 Q40 32 45 28" stroke="#8B5E3C" strokeWidth="1.2" fill="none" />
            <path d="M35 28 Q40 31 45 28" fill="#fff" opacity="0.5" />
          </g>
        )}

        {/* 20. Quantum Cat */}
        {type === "quantum_cat" && (
          <g className="animate-quantum-glitch">
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill="#0a0a1a" stroke={color} strokeWidth="0.5" />
            {/* Glitch offset body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} opacity="0.15" style={{ transform: "translate(1px, -1px)" }} />
            {/* Ears */}
            <polygon points="26,14 18,2 32,11" fill="#0a0a1a" stroke={color} strokeWidth="0.8" />
            <polygon points="54,14 62,2 48,11" fill="#0a0a1a" stroke={color} strokeWidth="0.8" />
            <polygon points="27,13 21,5 30,11" fill={color} opacity="0.4" />
            <polygon points="53,13 59,5 50,11" fill={color} opacity="0.4" />
            {/* Head dark */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill="#0a0a1a" stroke={color} strokeWidth="0.8" />
            {/* Matrix scan lines */}
            <line x1="28" y1="16" x2="52" y2="16" stroke={color} strokeWidth="0.4" opacity="0.4" />
            <line x1="28" y1="20" x2="52" y2="20" stroke={color} strokeWidth="0.4" opacity="0.4" />
            <line x1="28" y1="24" x2="52" y2="24" stroke={color} strokeWidth="0.4" opacity="0.4" />
            {/* Split neon eyes */}
            <ellipse cx="33" cy="20" rx="3.5" ry="4" fill={color} opacity="0.9" />
            <ellipse cx="47" cy="20" rx="3.5" ry="4" fill="#FF007F" opacity="0.9" />
            <ellipse cx="33" cy="20.5" rx="1.5" ry="2.5" fill="#000" />
            <ellipse cx="47" cy="20.5" rx="1.5" ry="2.5" fill="#000" />
            <circle cx="32.5" cy="18.8" r="0.8" fill="#fff" />
            <circle cx="46.5" cy="18.8" r="0.8" fill="#fff" />
            {/* Data nose */}
            <path d="M38.5 25 L40 26.5 L41.5 25 Z" fill={color} opacity="0.8" />
            {/* Glitch whiskers */}
            <line x1="22" y1="24" x2="34" y2="25" stroke={color} strokeWidth="0.7" opacity="0.6" />
            <line x1="22" y1="26" x2="34" y2="26.5" stroke="#FF007F" strokeWidth="0.7" opacity="0.5" />
            <line x1="58" y1="24" x2="46" y2="25" stroke={color} strokeWidth="0.7" opacity="0.6" />
            <line x1="58" y1="26" x2="46" y2="26.5" stroke="#FF007F" strokeWidth="0.7" opacity="0.5" />
          </g>
        )}

        {/* 21. Dolphin */}
        {type === "dolphin" && (
          <g>
            {/* Dorsal fin */}
            <path d="M42 20 L48 9 L52 20Z" fill={color} />
            {/* Body */}
            <ellipse cx="40" cy="32" rx="20" ry="11" fill={color} />
            {/* Belly white */}
            <ellipse cx="40" cy="34" rx="13" ry="6" fill="#fff" opacity="0.3" />
            {/* Tail flukes */}
            <path d="M58 32 Q68 28 70 22 Q64 26 60 30Z" fill={color} />
            <path d="M58 35 Q68 38 70 44 Q64 38 60 34Z" fill={color} />
            {/* Head with bottlenose */}
            <ellipse cx="26" cy="28" rx="14" ry="11" fill={color} />
            {/* Snout */}
            <path d="M14 28 Q8 27 6 29 Q8 31 14 30Z" fill={color} />
            {/* Smile line */}
            <path d="M8 30 Q12 33 18 32" stroke="#fff" strokeWidth="1" fill="none" opacity="0.5" />
            {/* Eye */}
            <circle cx="20" cy="23" r="3" fill="#fff" />
            <circle cx="20" cy="23.3" r="1.8" fill="#222" />
            <circle cx="19.3" cy="22.5" r="0.7" fill="#fff" />
          </g>
        )}

        {/* 22. Lion */}
        {type === "lion" && (
          <g>
            {/* Mane */}
            <circle cx="40" cy="23" r="18" fill="#C17A24" />
            <ellipse cx="40" cy="23" rx="18" ry="17" fill="#C17A24" />
            {/* Mane texture rays */}
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => (
              <line key={i}
                x1={40 + 15 * Math.cos(angle * Math.PI / 180)}
                y1={23 + 15 * Math.sin(angle * Math.PI / 180)}
                x2={40 + 19 * Math.cos(angle * Math.PI / 180)}
                y2={23 + 19 * Math.sin(angle * Math.PI / 180)}
                stroke="#A0621A" strokeWidth="2.5" strokeLinecap="round"
              />
            ))}
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Head */}
            <circle cx="40" cy="23" r="13.5" fill={color} />
            {/* Eyes */}
            <circle cx="33.5" cy="20" r="3" fill="#fff" />
            <circle cx="33.5" cy="20.3" r="1.9" fill="#A0522D" />
            <circle cx="33.5" cy="20.3" r="1" fill="#111" />
            <circle cx="32.8" cy="19.3" r="0.7" fill="#fff" />
            <circle cx="46.5" cy="20" r="3" fill="#fff" />
            <circle cx="46.5" cy="20.3" r="1.9" fill="#A0522D" />
            <circle cx="46.5" cy="20.3" r="1" fill="#111" />
            <circle cx="45.8" cy="19.3" r="0.7" fill="#fff" />
            {/* Proud expression */}
            <path d="M37 24 Q40 23 43 24" stroke="#222" strokeWidth="0.8" fill="none" />
            {/* Nose bridge */}
            <ellipse cx="40" cy="24" rx="4" ry="3" fill={color} />
            <ellipse cx="40" cy="25.5" rx="2.5" ry="1.8" fill="#C17A24" />
            {/* Whiskers */}
            <line x1="22" y1="24" x2="34" y2="25" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
            <line x1="22" y1="26" x2="34" y2="26.5" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
            <line x1="58" y1="24" x2="46" y2="25" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
            <line x1="58" y1="26" x2="46" y2="26.5" stroke="#fff" strokeWidth="0.7" opacity="0.6" />
          </g>
        )}

        {/* 23. Raccoon */}
        {type === "raccoon" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Striped tail hint */}
            <path d="M55 44 C64 38 68 28 62 22" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M55 44 C64 38 68 28 62 22" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="3 3" opacity="0.5" />
            {/* Ears */}
            <polygon points="27,13 22,2 32,9" fill={color} />
            <polygon points="28,12 25,5 31,9" fill="#fff" opacity="0.6" />
            <polygon points="53,13 58,2 48,9" fill={color} />
            <polygon points="52,12 55,5 49,9" fill="#fff" opacity="0.6" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Mask */}
            <ellipse cx="32" cy="21" rx="6" ry="4.5" fill="#222" opacity="0.75" />
            <ellipse cx="48" cy="21" rx="6" ry="4.5" fill="#222" opacity="0.75" />
            {/* White above mask */}
            <path d="M28 17 Q40 13 52 17" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
            {/* Eyes */}
            <circle cx="32" cy="21" r="2.8" fill="#fff" />
            <circle cx="32" cy="21.3" r="1.7" fill="#222" />
            <circle cx="31.3" cy="20.4" r="0.7" fill="#fff" />
            <circle cx="48" cy="21" r="2.8" fill="#fff" />
            <circle cx="48" cy="21.3" r="1.7" fill="#222" />
            <circle cx="47.3" cy="20.4" r="0.7" fill="#fff" />
            {/* Pointed snout */}
            <ellipse cx="40" cy="26" rx="4" ry="3" fill="#888" />
            <ellipse cx="40" cy="25" rx="2" ry="1.5" fill="#222" />
            {/* Clever smirk */}
            <path d="M40 27.5 Q44 29.5 47 28" stroke="#444" strokeWidth="0.9" fill="none" />
          </g>
        )}

        {/* 24. Parrot */}
        {type === "parrot" && (
          <g>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Wing hint */}
            <path d="M24 40 C18 36 16 30 18 26 C22 30 24 36 24 40Z" fill={color} />
            <path d="M24 40 C18 36 17 31 19 28" stroke="#fff" strokeWidth="0.5" fill="none" opacity="0.3" />
            {/* Colorful crest feathers */}
            <path d="M40 10 C36 4 32 0 34 -4 C36 0 38 6 40 10Z" fill="#E63946" />
            <path d="M40 10 C40 3 38 -2 41 -5 C42 -1 42 5 40 10Z" fill="#FFB703" />
            <path d="M40 10 C44 4 48 0 46 -4 C44 0 42 6 40 10Z" fill="#2EC4B6" />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill={color} />
            {/* Color patches */}
            <ellipse cx="32" cy="25" rx="5" ry="4" fill="#E63946" opacity="0.6" />
            {/* Eye */}
            <circle cx="33" cy="20" r="4" fill="#fff" />
            <circle cx="33" cy="20.3" r="2.5" fill="#FFB703" />
            <circle cx="33" cy="20.3" r="1.5" fill="#111" />
            <circle cx="32.2" cy="19.3" r="0.7" fill="#fff" />
            {/* Hooked beak */}
            <path d="M38 22 Q43 22 44 26 Q40 29 36 25 Q37 22 38 22Z" fill="#FFB703" />
            <path d="M38 22 Q43 22 43.5 25" stroke="#E8950A" strokeWidth="0.7" fill="none" />
          </g>
        )}

        {/* 25. Snake */}
        {type === "snake" && (
          <g>
            {/* Coiled body */}
            <path d="M26 44 Q36 50 46 44 Q56 38 54 30 Q52 22 44 20" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
            <path d="M26 44 Q36 50 46 44 Q56 38 54 30 Q52 22 44 20" stroke="#000" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.1" style={{ transform: "translate(0.5px, 0.5px)" }} />
            {/* Scale dots on body */}
            <circle cx="36" cy="45" r="1" fill="#000" opacity="0.2" />
            <circle cx="44" cy="42" r="1" fill="#000" opacity="0.2" />
            <circle cx="52" cy="36" r="1" fill="#000" opacity="0.2" />
            {/* Head */}
            <ellipse cx="40" cy="18" rx="11" ry="9" fill={color} />
            <ellipse cx="40" cy="18" rx="9" ry="7" fill={color} />
            {/* Slit eyes */}
            <ellipse cx="35" cy="15.5" rx="2.5" ry="2.8" fill="#ffdd00" />
            <ellipse cx="35" cy="15.5" rx="0.8" ry="2.5" fill="#111" />
            <circle cx="34.5" cy="14.3" r="0.5" fill="#fff" opacity="0.5" />
            <ellipse cx="45" cy="15.5" rx="2.5" ry="2.8" fill="#ffdd00" />
            <ellipse cx="45" cy="15.5" rx="0.8" ry="2.5" fill="#111" />
            <circle cx="44.5" cy="14.3" r="0.5" fill="#fff" opacity="0.5" />
            {/* Forked tongue */}
            <path d="M40 23 L40 28 M38.2 28 L40 26.5 L41.8 28" stroke="#FF3D00" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* 26. Dragon */}
        {type === "dragon" && (
          <g filter="url(#legendaryGlow)" className="animate-dragon-breathe" style={{ transformOrigin: "40px 28px" }}>
            {/* Wings folded back */}
            <path d="M22 32 C10 22 8 10 14 8 C18 6 22 18 24 30Z" fill={color} opacity="0.7" className="animate-wing-flap" style={{ transformOrigin: "22px 30px" }} />
            <path d="M22 32 C10 22 8 10 14 8 C18 6 22 18 24 30Z" fill="#000" opacity="0.15" className="animate-wing-flap" style={{ transformOrigin: "22px 30px" }} />
            <path d="M58 32 C70 22 72 10 66 8 C62 6 58 18 56 30Z" fill={color} opacity="0.7" className="animate-wing-flap-alt" style={{ transformOrigin: "58px 30px" }} />
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            {/* Spiky horns */}
            <polygon points="30,12 24,-2 34,8" fill="#FF3D00" />
            <polygon points="50,12 56,-2 46,8" fill="#FF3D00" />
            {/* Head */}
            <ellipse cx="40" cy="23" rx="14" ry="12" fill={color} />
            {/* Scales texture */}
            <path d="M28 22 Q40 18 52 22" stroke="#000" strokeWidth="0.5" fill="none" opacity="0.2" />
            <path d="M30 27 Q40 24 50 27" stroke="#000" strokeWidth="0.5" fill="none" opacity="0.2" />
            {/* Glowing eyes */}
            <circle cx="32.5" cy="20" r="3.5" fill="#00F5D4" />
            <circle cx="32.5" cy="20.3" r="2" fill="#00A898" />
            <circle cx="32.5" cy="20.3" r="1" fill="#111" />
            <circle cx="31.8" cy="19.2" r="0.8" fill="#fff" />
            <circle cx="47.5" cy="20" r="3.5" fill="#00F5D4" />
            <circle cx="47.5" cy="20.3" r="2" fill="#00A898" />
            <circle cx="47.5" cy="20.3" r="1" fill="#111" />
            <circle cx="46.8" cy="19.2" r="0.8" fill="#fff" />
            {/* Fire breath curl */}
            <path d="M37 28 Q40 34 43 28" fill="#FF5E6C" opacity="0.9" className="animate-flame-spark" />
            <path d="M38 29 Q40 33 42 29" fill="#FFBE0B" opacity="0.6" className="animate-flame-spark" style={{ animationDelay: "0.1s" }} />
          </g>
        )}

        {/* 27. Phoenix */}
        {type === "phoenix" && (
          <g filter="url(#legendaryGlow)" className="animate-phoenix-rise" style={{ transformOrigin: "40px 30px" }}>
            {/* Tail feathers down */}
            <path d="M36 42 Q32 52 28 56" stroke="#FF3D00" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M40 43 Q40 54 38 58" stroke="#FFBE0B" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M44 42 Q48 52 52 56" stroke="#FF3D00" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Wings spreading */}
            <path d="M22 30 C8 22 4 12 10 8 C16 4 22 20 24 30Z" fill="#FF3D00" className="animate-wing-flap" style={{ transformOrigin: "22px 28px" }} />
            <path d="M22 30 C8 22 4 12 10 8 C16 4 22 20 24 30Z" fill="#FFBE0B" opacity="0.4" className="animate-wing-flap" style={{ transformOrigin: "22px 28px" }} />
            <path d="M58 30 C72 22 76 12 70 8 C64 4 58 20 56 30Z" fill="#FF3D00" className="animate-wing-flap-alt" style={{ transformOrigin: "58px 28px" }} />
            <path d="M58 30 C72 22 76 12 70 8 C64 4 58 20 56 30Z" fill="#FFBE0B" opacity="0.4" className="animate-wing-flap-alt" style={{ transformOrigin: "58px 28px" }} />
            {/* Body */}
            <ellipse cx="40" cy="36" rx="12" ry="8" fill={color} />
            {/* Blazing crest */}
            <path d="M36 10 C32 4 34 -2 38 -4 C37 0 38 6 40 10Z" fill="#FF3D00" className="animate-flame-spark" />
            <path d="M40 9 C38 2 40 -4 42 -5 C41 -1 41 5 40 9Z" fill="#FFBE0B" className="animate-flame-spark" style={{ animationDelay: "0.15s" }} />
            <path d="M44 10 C48 4 46 -2 42 -4 C43 0 42 6 40 10Z" fill="#FF3D00" className="animate-flame-spark" style={{ animationDelay: "0.08s" }} />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="12" ry="11" fill={color} />
            {/* Eyes */}
            <circle cx="33.5" cy="19.5" r="3" fill="#FFBE0B" />
            <circle cx="33.5" cy="19.8" r="1.8" fill="#FF3D00" />
            <circle cx="33.5" cy="19.8" r="0.9" fill="#111" />
            <circle cx="32.8" cy="18.8" r="0.7" fill="#fff" />
            <circle cx="46.5" cy="19.5" r="3" fill="#FFBE0B" />
            <circle cx="46.5" cy="19.8" r="1.8" fill="#FF3D00" />
            <circle cx="46.5" cy="19.8" r="0.9" fill="#111" />
            <circle cx="45.8" cy="18.8" r="0.7" fill="#fff" />
            {/* Beak */}
            <polygon points="40,23 37,20 43,20" fill="#FFBE0B" />
          </g>
        )}

        {/* 28. Cyber Fox */}
        {type === "cyber_fox" && (
          <g filter="url(#legendaryGlow)" className="animate-cyberfox-glitch" style={{ transformOrigin: "40px 28px" }}>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill="#1A1A2E" stroke={color} strokeWidth="0.5" />
            {/* Circuit line tattoos on body */}
            <path d="M28 40 L32 38 L36 40 L36 43" stroke={color} strokeWidth="0.5" fill="none" opacity="0.7" />
            <path d="M52 40 L48 38 L44 40 L44 43" stroke={color} strokeWidth="0.5" fill="none" opacity="0.7" />
            {/* Antenna ears */}
            <polygon points="26,13 17,-1 30,10" fill="#1A1A2E" stroke={color} strokeWidth="0.8" />
            <line x1="21.5" y1="6" x2="18" y2="0" stroke={color} strokeWidth="1" />
            <circle cx="17.5" cy="-1" r="2" fill={color} className="animate-led-blink" />
            <polygon points="54,13 63,-1 50,10" fill="#1A1A2E" stroke={color} strokeWidth="0.8" />
            <line x1="58.5" y1="6" x2="62" y2="0" stroke={color} strokeWidth="1" />
            <circle cx="62.5" cy="-1" r="2" fill="#FF007F" className="animate-led-blink" style={{ animationDelay: "0.3s" }} />
            {/* Head */}
            <ellipse cx="40" cy="22" rx="13" ry="12" fill="#1A1A2E" stroke={color} strokeWidth="0.5" />
            {/* Circuit face lines */}
            <path d="M28 20 L32 20 L32 24 L36 24" stroke={color} strokeWidth="0.5" fill="none" opacity="0.6" />
            <path d="M52 20 L48 20 L48 24 L44 24" stroke={color} strokeWidth="0.5" fill="none" opacity="0.6" />
            {/* Neon visor */}
            <rect x="25" y="17" width="30" height="6" rx="3" fill={color} opacity="0.25" />
            <rect x="25" y="17" width="30" height="6" rx="3" stroke={color} strokeWidth="0.8" fill="none" className="animate-cyber-scan" />
            {/* LED eyes */}
            <circle cx="33" cy="20" r="2.5" fill={color} />
            <circle cx="33" cy="20" r="1.5" fill="#000" />
            <circle cx="32.4" cy="19.4" r="0.6" fill={color} opacity="0.8" />
            <circle cx="47" cy="20" r="2.5" fill={color} />
            <circle cx="47" cy="20" r="1.5" fill="#000" />
            <circle cx="46.4" cy="19.4" r="0.6" fill={color} opacity="0.8" />
            {/* Mechanical jaw */}
            <path d="M34 26 L40 28 L46 26" stroke={color} strokeWidth="0.7" fill="none" opacity="0.5" />
            <rect x="38" y="26" width="4" height="1.5" rx="0.5" fill={color} opacity="0.3" />
          </g>
        )}

        {/* 29. Unicorn */}
        {type === "unicorn" && (
          <g filter="url(#legendaryGlow)" className="animate-unicorn-drift" style={{ transformOrigin: "40px 28px" }}>
            {/* Body */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill={color} />
            <ellipse cx="40" cy="41" rx="9" ry="5" fill="#fff" opacity="0.2" />
            {/* Flowing mane */}
            <path d="M27 14 C24 18 22 24 24 30" stroke="#FF6B9D" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M27 14 C25 19 24 25 26 31" stroke="#C77DFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M28 13 C27 18 27 24 28 30" stroke="#7BE0FF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
            {/* Ears */}
            <polygon points="29,13 25,4 33,10" fill={color} />
            <polygon points="30,12 27,6 32,10" fill="#FFD6E8" opacity="0.8" />
            <polygon points="51,13 55,4 47,10" fill={color} />
            <polygon points="50,12 53,6 48,10" fill="#FFD6E8" opacity="0.8" />
            {/* Spiral horn */}
            <path d="M40 10 L36 -5 L44 -5 Z" fill="#00F5D4" className="animate-horn-glow" style={{ transformOrigin: "40px 10px" }} />
            <line x1="38" y1="6" x2="40" y2="0" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            <line x1="40" y1="8" x2="42.5" y2="2" stroke="#fff" strokeWidth="0.6" opacity="0.6" />
            {/* Star sparkles */}
            <text x="18" y="10" fontSize="5" fill="#FFBE0B">✦</text>
            <text x="58" y="8" fontSize="4" fill="#C77DFF">✦</text>
            <text x="62" y="18" fontSize="3" fill="#7BE0FF">✦</text>
            {/* Head */}
            <ellipse cx="40" cy="23" rx="13" ry="12" fill={color} />
            {/* Eyes */}
            <ellipse cx="33.5" cy="20" rx="3.2" ry="3.8" fill="#fff" />
            <ellipse cx="33.5" cy="20.5" rx="2" ry="3" fill="#C77DFF" />
            <ellipse cx="33.5" cy="20.5" rx="1" ry="2" fill="#111" />
            <circle cx="32.8" cy="19.2" r="0.8" fill="#fff" />
            <ellipse cx="46.5" cy="20" rx="3.2" ry="3.8" fill="#fff" />
            <ellipse cx="46.5" cy="20.5" rx="2" ry="3" fill="#C77DFF" />
            <ellipse cx="46.5" cy="20.5" rx="1" ry="2" fill="#111" />
            <circle cx="45.8" cy="19.2" r="0.8" fill="#fff" />
            {/* Tiny nose */}
            <ellipse cx="40" cy="25.5" rx="1.8" ry="1.2" fill="#FFB5C8" />
            {/* Cheeks */}
            <ellipse cx="30" cy="25" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.4" />
            <ellipse cx="50" cy="25" rx="4" ry="2.5" fill="#FF9EBE" opacity="0.4" />
          </g>
        )}

        {/* 30. Robo Puppy */}
        {type === "robo_puppy" && (
          <g filter="url(#legendaryGlow)" className="animate-robo-jitter" style={{ transformOrigin: "40px 28px" }}>
            {/* Body - metal */}
            <path d="M27 36 C22 36 20 42 20 46 L60 46 C60 42 58 36 53 36 C50 33 30 33 27 36Z" fill="#C5D3E0" stroke="#8D9AA6" strokeWidth="0.8" />
            {/* Chest panel */}
            <rect x="33" y="36" width="14" height="9" rx="2" fill="#8D9AA6" opacity="0.5" />
            <circle cx="37" cy="40.5" r="1.5" fill="#00F5D4" className="animate-led-blink" />
            <circle cx="40" cy="40.5" r="1.5" fill="#FF3D00" className="animate-led-blink" style={{ animationDelay: "0.25s" }} />
            <circle cx="43" cy="40.5" r="1.5" fill="#FFBE0B" className="animate-led-blink" style={{ animationDelay: "0.5s" }} />
            {/* Metal plate ears */}
            <rect x="22" y="12" width="6" height="14" rx="2" fill="#8D9AA6" stroke="#6A7885" strokeWidth="0.5" />
            <rect x="23.5" y="14" width="3" height="4" rx="1" fill="#00F5D4" opacity="0.4" />
            <rect x="52" y="12" width="6" height="14" rx="2" fill="#8D9AA6" stroke="#6A7885" strokeWidth="0.5" />
            <rect x="53.5" y="14" width="3" height="4" rx="1" fill="#00F5D4" opacity="0.4" />
            {/* Antenna */}
            <line x1="40" y1="8" x2="40" y2="1" stroke="#8D9AA6" strokeWidth="2" />
            <line x1="36" y1="4" x2="44" y2="4" stroke="#8D9AA6" strokeWidth="1.2" />
            <circle cx="40" cy="0.5" r="2.5" fill="#FF3D00" className="animate-led-blink" />
            {/* Head - hex plates */}
            <ellipse cx="40" cy="23" rx="14" ry="13" fill="#C5D3E0" stroke="#8D9AA6" strokeWidth="0.8" />
            {/* Plate seam lines */}
            <line x1="28" y1="20" x2="52" y2="20" stroke="#8D9AA6" strokeWidth="0.5" opacity="0.5" />
            <line x1="40" y1="10" x2="40" y2="35" stroke="#8D9AA6" strokeWidth="0.5" opacity="0.4" />
            {/* Power indicator */}
            <rect x="36" y="29" width="8" height="2" rx="1" fill="#00F5D4" opacity="0.7" />
            {/* LED eyes */}
            <rect x="29" y="17" width="8" height="6" rx="2" fill="#001a1a" />
            <rect x="30" y="18" width="6" height="4" rx="1.5" fill="#00F5D4" opacity="0.9" className="animate-cyber-scan" />
            <rect x="43" y="17" width="8" height="6" rx="2" fill="#001a1a" />
            <rect x="44" y="18" width="6" height="4" rx="1.5" fill="#00F5D4" opacity="0.9" className="animate-cyber-scan" style={{ animationDelay: "0.2s" }} />
            {/* Speaker mouth grille */}
            <rect x="33" y="27" width="14" height="4" rx="2" fill="#8D9AA6" opacity="0.6" />
            <line x1="35" y1="28" x2="35" y2="30" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
            <line x1="37.5" y1="28" x2="37.5" y2="30" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
            <line x1="40" y1="28" x2="40" y2="30" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
            <line x1="42.5" y1="28" x2="42.5" y2="30" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
            <line x1="45" y1="28" x2="45" y2="30" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
          </g>
        )}

      </g>

      {/* ─── THINKING QUESTION MARK ─── */}
      {!activeState && (
        <g className="animate-question-float">
          <circle cx="16" cy="12" r="5" fill="#FFB703" filter="url(#neonGlowMascot)" />
          <text x="16" y="15.5" fill="#FFF" fontSize="10" fontWeight="bold" fontFamily="system-ui" textAnchor="middle">?</text>
        </g>
      )}

      {/* ─── LAPTOP & DESK ─── */}
      <g>
        <polygon points="12,49 68,49 76,58 4,58" fill="url(#deskGrad)" opacity="0.9" />
        <polygon points="26,34 54,34 56,45 24,45" fill="#12131C" stroke="#222533" strokeWidth="1" />
        <polygon points="28,36 52,36 54,43 26,43" fill="url(#screenGlow)" />
        <g className={cn(activeState ? "animate-code-pulse" : "opacity-40")} filter="url(#screenContentGlow)">
          <line x1="31" y1="38" x2="40" y2="38" stroke="#00F5D4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="31" y1="40" x2="46" y2="40" stroke="#FF007F" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="31" y1="42" x2="36" y2="42" stroke="#7000FF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="39" y1="42" x2="47" y2="42" stroke="#FFBE0B" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <polygon points="24,45 56,45 60,51 20,51" fill="url(#laptopBody)" stroke="#161822" strokeWidth="0.8" />
        <polygon points="25,45.5 55,45.5 57,48 23,48" fill="#11121A" opacity="0.8" />
        <polygon points="36,49 44,49 44.5,50.5 35.5,50.5" fill="#5C5E70" opacity="0.5" />
      </g>

      {/* ─── PAWS ─── */}
      <g>
        <g className={cn(activeState ? "animate-paw-type-left" : "animate-paw-think-scratch")} style={{ transformOrigin: "26px 47px" }}>
          {type === "crab" ? (
            <path d="M 22 45 Q 19 39 24 40 Q 27 41 24 46 Z" fill={color} stroke="#111" strokeWidth="0.8" />
          ) : (
            <circle cx="26" cy="47" r="4.5" fill={["panda","octopus","koala","badger","raccoon","robo_puppy"].includes(type) ? "#888" : color} stroke="rgba(0,0,0,0.15)" strokeWidth="0.75" />
          )}
        </g>
        <g className={cn(activeState ? "animate-paw-type-right" : "animate-paw-think-tap")} style={{ transformOrigin: "54px 47px" }}>
          {type === "crab" ? (
            <path d="M 58 45 Q 61 39 56 40 Q 53 41 56 46 Z" fill={color} stroke="#111" strokeWidth="0.8" />
          ) : (
            <circle cx="54" cy="47" r="4.5" fill={["panda","octopus","koala","badger","raccoon","robo_puppy"].includes(type) ? "#888" : color} stroke="rgba(0,0,0,0.15)" strokeWidth="0.75" />
          )}
        </g>
      </g>

      <style jsx>{`
        @keyframes mascotThinking {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(-1px); }
        }
        .animate-mascot-thinking { animation: mascotThinking 2.5s infinite ease-in-out; }

        @keyframes questionFloat {
          0%, 100% { transform: translateY(0) scale(0.9); opacity: 0.8; }
          50% { transform: translateY(-3px) scale(1.05); opacity: 1; }
        }
        .animate-question-float { animation: questionFloat 1.8s infinite ease-in-out; }

        @keyframes codePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-code-pulse { animation: codePulse 0.4s infinite ease-in-out alternate; }

        @keyframes pawTypeLeft {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(2px, -5px, 0); }
        }
        .animate-paw-type-left { animation: pawTypeLeft 0.16s infinite ease-in-out alternate; }

        @keyframes pawTypeRight {
          0%, 100% { transform: translate3d(0, -5px, 0); }
          50% { transform: translate3d(-2px, 0, 0); }
        }
        .animate-paw-type-right { animation: pawTypeRight 0.16s infinite ease-in-out alternate; }

        @keyframes pawThinkScratch {
          0%, 100% { transform: translate3d(-3px, -18px, 0) rotate(-10deg); }
          50% { transform: translate3d(-3px, -21px, 0) rotate(5deg); }
        }
        .animate-paw-think-scratch { animation: pawThinkScratch 0.8s infinite ease-in-out alternate; }

        @keyframes pawThinkTap {
          0%, 100% { transform: translate3d(-10px, -15px, 0); }
          50% { transform: translate3d(-10px, -13px, 0); }
        }
        .animate-paw-think-tap { animation: pawThinkTap 1.2s infinite ease-in-out alternate; }

        @keyframes earWiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        .animate-ear-wiggle { animation: earWiggle 1s infinite ease-in-out; }

        @keyframes earWiggleAlt {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        .animate-ear-wiggle-alt { animation: earWiggleAlt 1.2s infinite ease-in-out; }

        @keyframes wingFlap {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          50% { transform: scaleX(0.9) rotate(-15deg); }
        }
        .animate-wing-flap { animation: wingFlap 0.4s infinite ease-in-out alternate; }

        @keyframes wingFlapAlt {
          0%, 100% { transform: scaleX(1) rotate(0deg); }
          50% { transform: scaleX(0.9) rotate(15deg); }
        }
        .animate-wing-flap-alt { animation: wingFlapAlt 0.4s infinite ease-in-out alternate; }

        @keyframes tentacleWave {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-2px, -3px, 0) rotate(8deg); }
        }
        .animate-tentacle-wave { animation: tentacleWave 0.8s infinite ease-in-out alternate; }

        @keyframes waterSpout {
          0%, 100% { transform: scaleY(0.8); opacity: 0.5; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
        .animate-water-spout { animation: waterSpout 0.6s infinite ease-in-out alternate; }

        @keyframes quantumGlitch {
          0%, 100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          20% { transform: translate(-0.5px, 0.5px); }
          40% { transform: translate(0.5px, -0.5px); }
          60% { transform: translate(-1px, 0); filter: hue-rotate(90deg); }
          80% { transform: translate(1px, 1px); }
        }
        .animate-quantum-glitch { animation: quantumGlitch 3s infinite linear; }

        @keyframes flameSpark {
          0%, 100% { transform: scaleY(0.9) translate3d(0, 0, 0); }
          50% { transform: scaleY(1.4) translate3d(0.5px, -2px, 0); }
        }
        .animate-flame-spark { animation: flameSpark 0.3s infinite ease-in-out alternate; }

        @keyframes cyberScan {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; box-shadow: 0 0 4px currentColor; }
        }
        .animate-cyber-scan { animation: cyberScan 0.5s infinite ease-in-out alternate; }

        @keyframes hornGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(2) drop-shadow(0 0 5px #00F5D4); }
        }
        .animate-horn-glow { animation: hornGlow 0.8s infinite ease-in-out alternate; }

        @keyframes ledBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-led-blink { animation: ledBlink 0.5s infinite ease-in-out alternate; }

        /* ══ LEGENDARY UNIQUE ANIMATIONS ══ */

        /* Dragon — power-breathe: swells up, eyes flare, then exhales */
        @keyframes dragonBreathe {
          0%   { transform: scale(1) translateY(0);    filter: brightness(1); }
          30%  { transform: scale(1.04) translateY(-1px); filter: brightness(1.15) drop-shadow(0 0 6px #00F5D4); }
          55%  { transform: scale(1.06) translateY(-2px); filter: brightness(1.3) drop-shadow(0 0 12px #FF3D00); }
          75%  { transform: scale(1.03) translateY(-1px); filter: brightness(1.1); }
          100% { transform: scale(1) translateY(0);    filter: brightness(1); }
        }
        .animate-dragon-breathe { animation: dragonBreathe 2.8s infinite ease-in-out; }

        /* Phoenix — ethereal rise: floats upward with hue shimmer like rising flames */
        @keyframes phoenixRise {
          0%   { transform: translateY(0) rotate(0deg);   filter: hue-rotate(0deg) brightness(1); }
          25%  { transform: translateY(-3px) rotate(-1deg); filter: hue-rotate(15deg) brightness(1.2); }
          50%  { transform: translateY(-5px) rotate(0deg);  filter: hue-rotate(30deg) brightness(1.4) drop-shadow(0 0 8px #FFBE0B); }
          75%  { transform: translateY(-3px) rotate(1deg);  filter: hue-rotate(15deg) brightness(1.2); }
          100% { transform: translateY(0) rotate(0deg);   filter: hue-rotate(0deg) brightness(1); }
        }
        .animate-phoenix-rise { animation: phoenixRise 2.2s infinite ease-in-out; }

        /* Cyber Fox — rapid data glitch: sharp x-axis jerk + colour-channel split */
        @keyframes cyberfoxGlitch {
          0%,  8%,  100% { transform: translate(0, 0) skewX(0deg); filter: hue-rotate(0deg); }
          10%            { transform: translate(-2px, 0) skewX(-2deg); filter: hue-rotate(90deg) brightness(1.4); }
          12%            { transform: translate(2px, 0) skewX(2deg);  filter: hue-rotate(-90deg) brightness(0.8); }
          14%            { transform: translate(0, 0) skewX(0deg); filter: hue-rotate(0deg); }
          50%, 58%       { transform: translate(0, 0); filter: hue-rotate(0deg); }
          60%            { transform: translate(1px, -1px) skewX(-1deg); filter: hue-rotate(180deg) brightness(1.6); }
          62%            { transform: translate(-1px, 1px) skewX(1deg);  filter: hue-rotate(-60deg); }
          64%            { transform: translate(0, 0); filter: hue-rotate(0deg); }
        }
        .animate-cyberfox-glitch { animation: cyberfoxGlitch 3.5s infinite linear; }

        /* Unicorn — dreamy rainbow drift: gentle float + smooth prismatic hue cycle */
        @keyframes unicornDrift {
          0%   { transform: translateY(0) scale(1);      filter: hue-rotate(0deg) brightness(1); }
          25%  { transform: translateY(-2px) scale(1.01); filter: hue-rotate(60deg) brightness(1.1); }
          50%  { transform: translateY(-4px) scale(1.02); filter: hue-rotate(120deg) brightness(1.25) drop-shadow(0 0 6px #C77DFF); }
          75%  { transform: translateY(-2px) scale(1.01); filter: hue-rotate(200deg) brightness(1.1); }
          100% { transform: translateY(0) scale(1);      filter: hue-rotate(360deg) brightness(1); }
        }
        .animate-unicorn-drift { animation: unicornDrift 4s infinite linear; }

        /* Robo Puppy — mechanical jitter: rapid precise ticks like servo motors */
        @keyframes roboJitter {
          0%,  100% { transform: translate(0, 0) rotate(0deg); }
          10%        { transform: translate(1px, 0) rotate(0.5deg); }
          20%        { transform: translate(-1px, 0) rotate(-0.5deg); }
          30%        { transform: translate(0, -1px) rotate(0deg); }
          40%        { transform: translate(0, 0) rotate(0deg); }
          /* long idle gap */
          70%        { transform: translate(0, 0) rotate(0deg); }
          75%        { transform: translate(1.5px, -1px) rotate(1deg); }
          80%        { transform: translate(-1.5px, 1px) rotate(-1deg); }
          85%        { transform: translate(0.5px, 0) rotate(0.3deg); }
          90%        { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-robo-jitter { animation: roboJitter 2.5s infinite steps(1, end); }
      `}</style>
    </svg>
  );

  if (onlyMascot) return svgContent;

  return (
    <div className={cn(
      "flex items-center gap-3.5 px-4 py-2.5 bg-surface-2/95 border border-border/80 rounded-2xl transition-all duration-300 shadow-lg backdrop-blur-md max-w-fit font-mono text-xs select-none"
    )}>
      {svgContent}
      <div className="space-y-0.5 animate-in fade-in duration-300">
        <span className="font-bold text-xs text-text flex items-center gap-1.5">
          {opponentName ? (
            <span className="text-primary font-black truncate max-w-[100px]">{opponentName}</span>
          ) : "Opponent"}
          <span className="text-text-faint font-normal">
            {activeState ? "is coding" : "is thinking"}
          </span>
          <span className="flex gap-0.5 items-center">
            <span className="size-1 bg-text rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-1 bg-text rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-1 bg-text rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </span>
        <span className="text-[10px] text-text-faint block">
          {activeState ? "Synthesizing solution..." : "Pondering algorithms..."}
        </span>
      </div>
    </div>
  );
}
