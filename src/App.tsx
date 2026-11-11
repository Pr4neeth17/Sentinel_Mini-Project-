import { useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SourceBadge } from "./components/Badge";
import { ThemeToggle } from "./components/ThemeToggle";
import { Banner } from "./components/Banner";
import { Button } from "./components/ui";
import { useData } from "./context/DataContext";
import { apiLabel } from "./api";
import AttackDemos from "./pages/AttackDemos";
import Overview from "./pages/Overview";
import Defenses from "./pages/Defenses";
import Results from "./pages/Results";
import Traces from "./pages/Traces";
import Method from "./pages/Method";
import Lab from "./pages/Lab";

const NAV = [
  { to: "/", label: "Attack demos", end: true },
  { to: "/overview", label: "Overview" },
  { to: "/defenses", label: "Defenses" },
  { to: "/results", label: "Results" },
  { to: "/traces", label: "Traces" },
  { to: "/method", label: "Method" },
  { to: "/lab", label: "Lab" },
];

/** The product mark: a shield built from blocks, one block knocked out. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="2" fill="var(--accent-soft)" />
      <g fill="var(--accent)">
        <rect x="5" y="5" width="4" height="4" />
        <rect x="10" y="5" width="4" height="4" />
        <rect x="15" y="5" width="4" height="4" />
        <rect x="5" y="10" width="4" height="4" />
        <rect x="15" y="10" width="4" height="4" />
        <rect x="10" y="15" width="4" height="4" />
      </g>
    </svg>
  );
}

function NavItems({ onNavigate, mobile }: { onNavigate?: () => void; mobile?: boolean }) {
  return (
    <>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `font-mono text-[12px] font-medium uppercase tracking-[0.08em] transition-colors ${
              mobile
                ? `flex h-11 items-center border-b border-rule px-1 ${isActive ? "text-accent" : "text-muted hover:text-ink"}`
                : `relative flex h-14 items-center whitespace-nowrap px-0.5 ${
                    isActive
                      ? "text-accent after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-accent"
                      : "text-muted hover:text-ink"
                  }`
            }`
          }
        >
          {n.label}
        </NavLink>
      ))}
    </>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { backend, fallbackReason, reload, status } = useData();
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-frame">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only z-50 rounded-control bg-surface px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-frame">
        <div className="mx-auto flex h-14 max-w-[1344px] items-center gap-8 px-4 sm:px-6">
          <NavLink to="/" className="flex flex-none items-center gap-2.5" aria-label="PI Harness Console, home">
            <Mark />
            <span className="font-mono text-[15px] font-medium tracking-tight">
              <span className="text-accent">pi-harness</span>
              <span className="text-muted">/console</span>
            </span>
          </NavLink>

          <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center gap-6 overflow-hidden lg:flex">
            <NavItems />
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <SourceBadge />
            <ThemeToggle />
            <button
              ref={menuBtn}
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-control text-ink hover:bg-active lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" aria-label="Main" className="flex flex-col border-t border-border bg-frame px-4 pb-4 lg:hidden">
            <NavItems mobile onNavigate={() => setMenuOpen(false)} />
          </nav>
        )}
      </header>

      {/* Framed column: hairlines down both sides on wide screens, like an engineering drawing. */}
      <div className="mx-auto min-h-[calc(100vh-57px)] max-w-[1344px] xl:border-x xl:border-border">
        <main id="main" tabIndex={-1} className="w-full px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-10">
          {backend === "offline" && status === "ready" && (
            <div className="mb-6">
              <Banner
                kind="offline"
                action={
                  <Button variant="secondary" onClick={() => void reload()}>
                    Retry
                  </Button>
                }
              >
                <span className="font-medium">Backend offline. Showing demo data.</span>{" "}
                <span className="text-muted">
                  {fallbackReason ?? `Can’t reach ${apiLabel}.`} Start the backend, run <code className="font-mono text-code">npm run dev:mock</code>, or load files in Lab.
                </span>
              </Banner>
            </div>
          )}
          <Routes>
            <Route path="/" element={<AttackDemos />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/defenses" element={<Defenses />} />
            <Route path="/results" element={<Results />} />
            <Route path="/traces" element={<Traces />} />
            <Route path="/method" element={<Method />} />
            <Route path="/lab" element={<Lab />} />
            <Route
              path="*"
              element={
                <div className="py-16">
                  <h1 className="text-[32px] font-normal tracking-[-0.025em]">Page not found</h1>
                  <p className="mt-2 text-muted">
                    That address isn’t part of the console. <NavLink className="text-accent underline-offset-2 hover:underline" to="/">Go to Attack demos</NavLink>.
                  </p>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="flex flex-wrap items-end justify-between gap-4 border-t border-border px-4 pb-8 pt-8 sm:px-6 lg:px-8">
          <div>
            <p className="font-mono text-[22px] font-medium tracking-tight sm:text-[28px]">
              <span className="text-accent">pi-harness</span>
              <span className="text-muted">/console</span>
            </p>
            <p className="mt-2 text-sm text-muted">Prompt-injection defense harness for tool-using agents · A1 mini-project</p>
          </div>
          <p className="label">Front end only · contracts in docs/backend-contract.md</p>
        </footer>
      </div>
    </div>
  );
}
