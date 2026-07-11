"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn, initialOf } from "@/lib/utils";
import { MODE_COLORS, getTier, type BattleType } from "@/lib/theme";

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg hover:bg-primary-hover font-medium shadow-sm",
  secondary:
    "bg-surface-2 text-text hover:bg-surface-3 border border-border",
  ghost: "text-text-muted hover:text-text hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm",
  outline:
    "border border-border text-text-muted hover:border-primary hover:text-primary",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-lg gap-2",
  md: "h-10 px-5 text-[15px] rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-lg gap-2.5",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

// ── Input / Field ────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[15px] font-medium text-text"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-11 w-full rounded-lg border border-border bg-surface px-4 text-[15px] text-text",
          "placeholder:text-text-faint",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "transition-colors",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-faint">{hint}</p>
      ) : null}
    </div>
  );
});

// ── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
}

export function Select({ className, label, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[15px] font-medium text-text"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-border bg-surface px-4 text-[15px] text-text",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-text">
          {title}
        </h2>
        {subtitle && <p className="text-[15px] text-text-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ModeBadge({ type, className }: { type: BattleType; className?: string }) {
  const mode = MODE_COLORS[type] ?? MODE_COLORS.DSA;
  return (
    <Badge
      className={className}
      style={{ color: mode.accent, backgroundColor: mode.subtle }}
    >
      {mode.label}
    </Badge>
  );
}

export function TierBadge({
  rating,
  showRating = true,
  className,
}: {
  rating: number;
  showRating?: boolean;
  className?: string;
}) {
  const tier = getTier(rating);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="text-[15px] font-medium" style={{ color: tier.color }}>
        {tier.label}
      </span>
      {showRating && (
        <span className="font-mono text-[15px] text-text-faint">{rating}</span>
      )}
    </span>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name ?? "avatar"}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-medium text-text-faint",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initialOf(name)}
    </span>
  );
}

// ── Feedback ────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-10", className)}>
      <Loader2 className="size-6 animate-spin text-text-faint" />
    </div>
  );
}

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success" | "info";
  children: React.ReactNode;
}) {
  const tones = {
    danger: "border-danger/30 bg-loss-subtle text-danger",
    success: "border-success/30 bg-win-subtle text-success",
    info: "border-info/30 bg-surface-2 text-info",
  } as const;
  return (
    <div className={cn("rounded-lg border px-5 py-3.5 text-[15px]", tones[tone])} role="alert">
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      {icon && <div className="mb-2 text-text-faint">{icon}</div>}
      <p className="text-lg font-medium text-text">{title}</p>
      {message && <p className="max-w-md text-[15px] text-text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Stat ────────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div>
      <p className="text-[15px] text-text-faint">{label}</p>
      <p
        className="mt-1 font-mono text-3xl font-semibold text-text"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
