import { ReactNode } from "react";

/**
 * Suitable admin-dashboard type scale (Poppins, compact & professional).
 *
 *  eyebrow    11px / 600 / 0.18em uppercase — section kickers
 *  title      20px → 22px / 700            — page title only
 *  subtitle   12–13px / regular            — helper text under title
 *  cardLabel  11px / 700 / 0.14em uppercase— KPI + card labels
 *  kpi        22px / 800 tabular-nums      — KPI numbers only
 *  hint       11–12px                      — card helper text
 *  tableHead  11px / 700 / 0.12em uppercase— thead
 *  cell       13px                         — table body / inputs
 *  badge      10px → 11px / 600 uppercase  — status pills
 *  button     12px / 600 uppercase         — all admin buttons
 *  modalTitle 16px / 700                   — dialog title
 */

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function AdminEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("admin-eyebrow font-sans text-gold", className)}>{children}</p>;
}

export function AdminTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cx(
        "font-sans text-admin-title font-bold uppercase text-maroon sm:text-admin-title-lg",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function AdminSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("mt-0.5 font-sans text-admin-small text-ink/65 sm:text-admin-body", className)}>
      {children}
    </p>
  );
}

export function AdminCardLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("admin-card-label font-sans", className)}>{children}</span>;
}

export function AdminKpiValue({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p data-tnum className={cx("mt-2 font-sans text-admin-kpi font-extrabold tracking-tight", className)}>
      {children}
    </p>
  );
}

export function AdminHint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("mt-0.5 font-sans text-admin-micro leading-snug", className)}>{children}</p>;
}

export function AdminBadge({
  children,
  tone = "gold",
  className,
}: {
  children: ReactNode;
  tone?: "gold" | "green" | "rose" | "purple" | "solid-green" | "solid-rose";
  className?: string;
}) {
  const tones: Record<string, string> = {
    gold: "border border-gold/30 bg-champagne/40 text-maroon",
    green: "border border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border border-rose-200 bg-rose-50 text-rose-800",
    purple: "border border-purple-200 bg-purple-50 text-purple-700",
    "solid-green": "bg-emerald-800 text-white",
    "solid-rose": "bg-rose-800 text-white",
  };
  return (
    <span
      className={cx(
        "admin-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
