import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Link } from "react-router-dom";

/** Page title row: a large light headline + one line about the data, actions on the right. */
export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-border pb-6">
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[42px]">{title}</h1>
        {sub && <p className="mt-3 text-base text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Card with a mono label title, optional "FIG. n" tag. */
export function Panel({
  title,
  fig,
  aside,
  children,
  className = "",
  id,
}: {
  title?: ReactNode;
  fig?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-card border border-border bg-surface ${className}`}>
      {(title || aside) && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule px-5 py-3">
          {title && (
            <h2 className="label flex items-center gap-2.5 !text-ink">
              {fig && <span className="fig !text-muted">{fig}</span>}
              {title}
            </h2>
          )}
          {aside && <div className="text-sm text-muted">{aside}</div>}
        </header>
      )}
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  );
}

/** One-line reading under a chart. */
export function Reading({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm text-muted">{children}</p>;
}

type Variant = "primary" | "brand" | "secondary" | "ghost";

const BTN: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  brand: "bg-accent-soft text-accent hover:brightness-110",
  secondary: "border border-control bg-transparent text-ink hover:bg-raised",
  ghost: "text-muted hover:bg-active hover:text-ink",
};

const base =
  "inline-flex h-9 flex-none items-center justify-center gap-2 whitespace-nowrap rounded-control px-3.5 font-mono text-[12px] font-medium uppercase tracking-[0.06em] transition-[background-color,color,opacity,filter,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export function Button({ variant = "secondary", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${base} ${BTN[variant]} ${className}`} {...p} />;
}

export function LinkButton({ to, variant = "secondary", children }: { to: string; variant?: Variant; children: ReactNode }) {
  return (
    <Link to={to} className={`${base} ${BTN[variant]}`}>
      {children}
    </Link>
  );
}

export function Select({ label, className = "", children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      <select
        className="h-9 min-w-[160px] rounded-control border border-control bg-surface px-2.5 text-sm text-ink"
        {...p}
      >
        {children}
      </select>
    </label>
  );
}
