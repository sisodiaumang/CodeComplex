export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/logo.webp"
      alt="CodeComplex"
      className={className}
      style={{ height: `${size}px`, width: "auto", objectFit: "contain" }}
    />
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
          "text-lg font-bold tracking-tight text-text"
        }
      >
        Code<span className="text-primary">Complex</span>
      </span>
    </span>
  );
}
