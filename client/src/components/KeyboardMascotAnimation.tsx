"use client";

import { cn } from "@/lib/utils";

interface KeyboardMascotAnimationProps {
  active: boolean;
  pet?: { type: string; color: string } | null;
  onlyMascot?: boolean;
}

export default function KeyboardMascotAnimation({ active, pet, onlyMascot = false }: KeyboardMascotAnimationProps) {
  const type = pet?.type ?? "cat";
  const color = pet?.color ?? "#FF6B00";

  const svgContent = (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="shrink-0 overflow-visible drop-shadow-[0_6px_16px_rgba(0,0,0,0.16)]">
      <defs>
        {/* Soft shadow for the desk/mascot base */}
        <ellipse id="baseShadow" cx="40" cy="54" rx="30" ry="4" fill="rgba(0,0,0,0.15)" />
        
        {/* Shading gradients for desk & laptop */}
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

        {/* Glow filters */}
        <filter id="neonGlowMascot" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="screenContentGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ─── BASE ENVIRONMENT ─── */}
      <use href="#baseShadow" />
      
      {/* ─── MASCOT (SITTING BEHIND DESK & LAPTOP) ─── */}
      {/* Mascot tilts side to side when IDLE (thinking state) */}
      <g 
        className={cn(!active ? "animate-mascot-thinking" : "")} 
        style={{ transformOrigin: "40px 42px" }}
      >
        
        {/* Cat Mascot 🐱 */}
        {type === "cat" && (
          <g>
            {/* Body */}
            <path d="M26 38 C26 30, 54 30, 54 38 L50 46 L30 46 Z" fill={color} opacity="0.85" />
            
            {/* Left Ear */}
            <path d="M25 24 L16 8 L32 16 Z" fill={color} />
            <path d="M24 21 L18 11 L29 16 Z" fill="#FFC0E4" opacity="0.75" />
            {/* Right Ear */}
            <path d="M55 24 L64 8 L48 16 Z" fill={color} />
            <path d="M56 21 L62 11 L51 16 Z" fill="#FFC0E4" opacity="0.75" />

            {/* Head */}
            <circle cx="40" cy="23" r="14.5" fill={color} />

            {/* Rosy Cheeks */}
            <ellipse cx="29" cy="25" rx="3" ry="1.8" fill="#FF5E97" opacity="0.65" />
            <ellipse cx="51" cy="25" rx="3" ry="1.8" fill="#FF5E97" opacity="0.65" />

            {/* Eyes */}
            {active ? (
              // Happy Focused Coding Eyes
              <>
                <ellipse cx="32" cy="20" rx="3" ry="4" fill="#111" />
                <circle cx="31" cy="18" r="1" fill="#FFF" />
                <circle cx="33" cy="21" r="0.5" fill="#FFF" />
                
                <ellipse cx="48" cy="20" rx="3" ry="4" fill="#111" />
                <circle cx="47" cy="18" r="1" fill="#FFF" />
                <circle cx="49" cy="21" r="0.5" fill="#FFF" />
              </>
            ) : (
              // Confused / Squinting Thinking Eyes
              <>
                <path d="M 29.5 21 Q 32 18 34.5 21" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 45.5 21 Q 48 18 50.5 21" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            )}

            {/* Nose & Whiskers */}
            <polygon points="40,24 38.5,22.5 41.5,22.5" fill="#FF9EBE" />
            <line x1="22" y1="24" x2="15" y2="23" stroke="#222" strokeWidth="1" opacity="0.35" />
            <line x1="22" y1="27" x2="14" y2="28" stroke="#222" strokeWidth="1" opacity="0.35" />
            <line x1="58" y1="24" x2="65" y2="23" stroke="#222" strokeWidth="1" opacity="0.35" />
            <line x1="58" y1="27" x2="66" y2="28" stroke="#222" strokeWidth="1" opacity="0.35" />

            {/* Cute Mouth */}
            {active ? (
              <path d="M 38.5 25.5 Q 40 27.5 40 25.5 Q 40 27.5 41.5 25.5" stroke="#111" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M 37.5 26 Q 39 25 40 26.5 Q 41 27.5 42.5 26.5" stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        )}

        {/* Dog Mascot 🐶 */}
        {type === "dog" && (
          <g>
            {/* Body */}
            <path d="M26 38 C26 30, 54 30, 54 38 L50 46 L30 46 Z" fill={color} opacity="0.85" />

            {/* Floppy Ears */}
            <g className={cn(!active ? "animate-paw-left-bounce" : "")} style={{ transformOrigin: "26px 16px" }}>
              <path d="M26 16 C18 16, 14 30, 22 33 C27 34, 29 22, 27 16 Z" fill="#8D5B3E" />
            </g>
            <g className={cn(!active ? "animate-paw-right-bounce" : "")} style={{ transformOrigin: "54px 16px" }}>
              <path d="M54 16 C62 16, 66 30, 58 33 C53 34, 51 22, 53 16 Z" fill="#8D5B3E" />
            </g>

            {/* Head */}
            <circle cx="40" cy="23" r="14.5" fill={color} />

            {/* Eyes */}
            {active ? (
              <>
                <circle cx="33" cy="20" r="3.2" fill="#111" />
                <circle cx="32" cy="18.5" r="1" fill="#FFF" />
                <circle cx="47" cy="20" r="3.2" fill="#111" />
                <circle cx="46" cy="18.5" r="1" fill="#FFF" />
              </>
            ) : (
              <>
                <path d="M 31 21 Q 33 18 35 21" stroke="#111" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M 45 21 Q 47 18 49 21" stroke="#111" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </>
            )}

            {/* Snout & Nose */}
            <ellipse cx="40" cy="25" rx="5" ry="3.5" fill="#FFF" />
            <ellipse cx="40" cy="23.5" rx="2.5" ry="1.5" fill="#111" />

            {/* Blush */}
            <circle cx="27" cy="25" r="2.2" fill="#FF5E97" opacity="0.5" />
            <circle cx="53" cy="25" r="2.2" fill="#FF5E97" opacity="0.5" />

            {/* Mouth */}
            {active ? (
              <path d="M38.5 26.5 C38.5 29.5, 41.5 29.5, 41.5 26.5 Z" fill="#FF5E6C" />
            ) : (
              <path d="M 38 26.5 Q 40 25 42 26.5" stroke="#111" strokeWidth="1.2" fill="none" />
            )}
          </g>
        )}

        {/* Panda Mascot 🐼 */}
        {type === "panda" && (
          <g>
            {/* Body */}
            <path d="M26 38 C26 30, 54 30, 54 38 L50 46 L30 46 Z" fill="#222" opacity="0.95" />

            {/* Ears */}
            <circle cx="26" cy="12" r="5.5" fill="#222" />
            <circle cx="54" cy="12" r="5.5" fill="#222" />

            {/* Head */}
            <circle cx="40" cy="23" r="14.5" fill="#FFF" stroke="#DDD" strokeWidth="1" />

            {/* Eye Patches */}
            <ellipse cx="32" cy="21" rx="4.5" ry="5.5" fill="#222" transform="rotate(-15 32 21)" />
            <ellipse cx="48" cy="21" rx="4.5" ry="5.5" fill="#222" transform="rotate(15 48 21)" />

            {/* Eyes */}
            {active ? (
              <>
                <circle cx="33" cy="20" r="1.8" fill="#FFF" />
                <circle cx="32.5" cy="19.5" r="0.6" fill="#111" />
                <circle cx="47" cy="20" r="1.8" fill="#FFF" />
                <circle cx="46.5" cy="19.5" r="0.6" fill="#111" />
              </>
            ) : (
              <>
                <circle cx="33" cy="20.5" r="1" fill="#FFF" opacity="0.8" />
                <circle cx="47" cy="20.5" r="1" fill="#FFF" opacity="0.8" />
              </>
            )}

            {/* Blush */}
            <ellipse cx="27" cy="26" rx="2.5" ry="1.5" fill="#FF5E97" opacity="0.6" />
            <ellipse cx="53" cy="26" rx="2.5" ry="1.5" fill="#FF5E97" opacity="0.6" />

            {/* Nose & Mouth */}
            <ellipse cx="40" cy="24" rx="2" ry="1.2" fill="#222" />
            <path d="M 38.5 25.5 Q 40 27 40 25.5 Q 40 27 41.5 25.5" stroke="#222" strokeWidth="1" fill="none" />
          </g>
        )}

        {/* Crab Mascot 🦀 */}
        {type === "crab" && (
          <g>
            {/* Legs */}
            <path d="M 22 36 Q 16 38 22 41" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M 22 39 Q 15 42 21 44" stroke={color} strokeWidth="3" strokeLinecap="round" />
            
            <path d="M 58 36 Q 64 38 58 41" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M 58 39 Q 65 42 59 44" stroke={color} strokeWidth="3" strokeLinecap="round" />

            {/* Crab Body */}
            <ellipse cx="40" cy="30" rx="16" ry="11" fill="url(#mascotGradient)" />

            {/* Eyes on Stalks */}
            <line x1="31" y1="20" x2="31" y2="13" stroke={color} strokeWidth="3" />
            <circle cx="31" cy="11" r="4.2" fill="#FFF" stroke="#222" strokeWidth="0.5" />
            {active ? (
              <circle cx="31.5" cy="10.5" r="1.8" fill="#111" />
            ) : (
              <line x1="31" y1="9" x2="31" y2="13" stroke="#111" strokeWidth="1.5" />
            )}
            
            <line x1="49" y1="20" x2="49" y2="13" stroke={color} strokeWidth="3" />
            <circle cx="49" cy="11" r="4.2" fill="#FFF" stroke="#222" strokeWidth="0.5" />
            {active ? (
              <circle cx="48.5" cy="10.5" r="1.8" fill="#111" />
            ) : (
              <line x1="49" y1="9" x2="49" y2="13" stroke="#111" strokeWidth="1.5" />
            )}

            {/* Blush & Mouth */}
            <circle cx="28" cy="28" r="2" fill="#FF3D00" opacity="0.6" />
            <circle cx="52" cy="28" r="2" fill="#FF3D00" opacity="0.6" />
            {active ? (
              <path d="M 36 30 Q 40 34 44 30" stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            ) : (
              <line x1="36" y1="31" x2="44" y2="31" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </g>
        )}
      </g>

      {/* ─── FLOATING QUESTION MARK ANIMATION ─── */}
      {!active && (
        <g className="animate-question-float">
          <circle cx="16" cy="12" r="5" fill="#FFB703" filter="url(#neonGlowMascot)" />
          <text 
            x="16" 
            y="15.5" 
            fill="#FFF" 
            fontSize="10" 
            fontWeight="bold" 
            fontFamily="system-ui" 
            textAnchor="middle"
          >
            ?
          </text>
        </g>
      )}

      {/* ─── LOWERED LAPTOP & DESK ─── */}
      <g>
        {/* Desk Surface Overlay */}
        <polygon points="12,49 68,49 76,58 4,58" fill="url(#deskGrad)" opacity="0.9" />

        {/* Laptop Screen (Lowered: Top at Y=34 instead of 24) */}
        {/* Screen Frame */}
        <polygon points="26,34 54,34 56,45 24,45" fill="#12131C" stroke="#222533" strokeWidth="1" />
        
        {/* Glowing Screen Content */}
        <polygon points="28,36 52,36 54,43 26,43" fill="url(#screenGlow)" />

        {/* Glowing Code Lines */}
        <g 
          className={cn(active ? "animate-code-pulse" : "opacity-40")} 
          filter="url(#screenContentGlow)"
        >
          <line x1="31" y1="38" x2="40" y2="38" stroke="#00F5D4" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="31" y1="40" x2="46" y2="40" stroke="#FF007F" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="31" y1="42" x2="36" y2="42" stroke="#7000FF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="39" y1="42" x2="47" y2="42" stroke="#FFBE0B" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Laptop Keyboard base */}
        <polygon points="24,45 56,45 60,51 20,51" fill="url(#laptopBody)" stroke="#161822" strokeWidth="0.8" />
        
        {/* Keyboard Keys Layout */}
        <polygon points="25,45.5 55,45.5 57,48 23,48" fill="#11121A" opacity="0.8" />
        {/* Trackpad */}
        <polygon points="36,49 44,49 44.5,50.5 35.5,50.5" fill="#5C5E70" opacity="0.5" />
      </g>

      {/* ─── PAWS / CLAWS TYPING OR THINKING ANIMATION ─── */}
      <g>
        {/* Left Paw / Scratching Head Claw */}
        <g 
          className={cn(active ? "animate-paw-type-left" : "animate-paw-think-scratch")} 
          style={{ transformOrigin: "26px 47px" }}
        >
          {type === "crab" ? (
            <path d="M 22 45 Q 19 39 24 40 Q 27 41 24 46 Z" fill={color} stroke="#111" strokeWidth="0.8" />
          ) : (
            <circle cx="26" cy="47" r="4.5" fill={type === "panda" ? "#222" : color} stroke="rgba(0,0,0,0.15)" strokeWidth="0.75" />
          )}
        </g>

        {/* Right Paw / Tapping Chin Claw */}
        <g 
          className={cn(active ? "animate-paw-type-right" : "animate-paw-think-tap")} 
          style={{ transformOrigin: "54px 47px" }}
        >
          {type === "crab" ? (
            <path d="M 58 45 Q 61 39 56 40 Q 53 41 56 46 Z" fill={color} stroke="#111" strokeWidth="0.8" />
          ) : (
            <circle cx="54" cy="47" r="4.5" fill={type === "panda" ? "#222" : color} stroke="rgba(0,0,0,0.15)" strokeWidth="0.75" />
          )}
        </g>
      </g>

      {/* CSS Keyframes for High Fidelity Animations */}
      <style jsx>{`
        /* Mascot slow confused head-tilt when thinking */
        @keyframes mascotThinking {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(-1px); }
        }
        .animate-mascot-thinking {
          animation: mascotThinking 2.5s infinite ease-in-out;
        }

        /* Question Mark floating glow bounce */
        @keyframes questionFloat {
          0%, 100% { transform: translateY(0) scale(0.9); opacity: 0.8; }
          50% { transform: translateY(-3px) scale(1.05); opacity: 1; }
        }
        .animate-question-float {
          animation: questionFloat 1.8s infinite ease-in-out;
        }

        /* Flashing Code Lines on Laptop Screen */
        @keyframes codePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-code-pulse {
          animation: codePulse 0.4s infinite ease-in-out alternate;
        }

        /* Active coding typing paw movement (left) */
        @keyframes pawTypeLeft {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(2px, -5px, 0); }
        }
        .animate-paw-type-left {
          animation: pawTypeLeft 0.16s infinite ease-in-out alternate;
        }

        /* Active coding typing paw movement (right) */
        @keyframes pawTypeRight {
          0%, 100% { transform: translate3d(0, -5px, 0); }
          50% { transform: translate3d(-2px, 0, 0); }
        }
        .animate-paw-type-right {
          animation: pawTypeRight 0.16s infinite ease-in-out alternate;
        }

        /* Thinking state: scratching head claw/paw */
        @keyframes pawThinkScratch {
          0%, 100% { transform: translate3d(-3px, -18px, 0) rotate(-10deg); }
          50% { transform: translate3d(-3px, -21px, 0) rotate(5deg); }
        }
        .animate-paw-think-scratch {
          animation: pawThinkScratch 0.8s infinite ease-in-out alternate;
        }

        /* Thinking state: tapping chin claw/paw */
        @keyframes pawThinkTap {
          0%, 100% { transform: translate3d(-10px, -15px, 0); }
          50% { transform: translate3d(-10px, -13px, 0); }
        }
        .animate-paw-think-tap {
          animation: pawThinkTap 1.2s infinite ease-in-out alternate;
        }
      `}</style>
    </svg>
  );

  if (onlyMascot) {
    return svgContent;
  }

  return (
    <div className={cn(
      "flex items-center gap-3.5 px-4 py-2.5 bg-surface-2/95 border border-border/80 rounded-2xl transition-all duration-300 shadow-lg backdrop-blur-md max-w-fit font-mono text-xs select-none",
      active ? "opacity-100 scale-100 translate-y-0" : "opacity-100 scale-100 translate-y-0"
    )}>
      {svgContent}
      <div className="space-y-0.5 animate-in fade-in duration-300">
        <span className="font-bold text-xs text-text flex items-center gap-1.5">
          {active ? "Opponent is coding" : "Opponent is thinking"}
          <span className="flex gap-0.5 items-center">
            <span className="size-1 bg-text rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="size-1 bg-text rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="size-1 bg-text rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </span>
        <span className="text-[10px] text-text-faint block">
          {active ? "Synthesizing solution..." : "Pondering algorithms..."}
        </span>
      </div>
    </div>
  );
}
