export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect width="32" height="32" rx="8" fill="#FF6B00" />

      {/* Left angle bracket < */}
      <path
        d="M14 10L8.5 16L14 22"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right angle bracket > */}
      <path
        d="M18 10L23.5 16L18 22"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center slash / — the "war" slash */}
      <path
        d="M17.5 9L14.5 23"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function LogoFull({
  size = 28,
  textClass,
}: {
  size?: number;
  textClass?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span
        className={
          textClass ??
          "text-lg font-bold tracking-tight"
        }
      >
        Dev<span className="text-primary">War</span>
      </span>
    </span>
  );
}
