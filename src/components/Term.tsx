import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { GLOSSARY } from "../lib/glossary";

/** Jargon with an in-place explanation. Focusable, so keyboard users get the tooltip too. */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children?: ReactNode }) {
  const g = GLOSSARY[k];
  if (!g) return <>{children ?? k}</>;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          className={`cursor-help p-0 text-inherit [font:inherit] [letter-spacing:inherit] [text-transform:inherit] ${typeof children === "string" || children === undefined ? "border-b border-dotted border-current" : "inline-flex rounded hover:text-ink"}`}
          aria-label={`${g.term}: ${g.def}`}
        >
          {children ?? k}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 max-w-[280px] rounded-control border border-border bg-surface px-3 py-2 text-xs font-normal normal-case text-ink shadow-lg"
        >
          <span className="font-semibold">{g.term}.</span> {g.def}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
