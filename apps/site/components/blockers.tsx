import type { DeepDiveScopeEntry, TopBlocker } from "@/lib/types";
import { verifyEffortLabel } from "@leapscore/contracts";
import Link from "next/link";
import { INDICATOR_REGISTRY } from "@/lib/generated/rubric";
import { tryIndicatorHref } from "@/lib/rubric-links";

function truncateQuickWin(s: string, n = 110): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

export function TopBlockers({ blockers }: { blockers?: TopBlocker[] }) {
  const safe = blockers ?? [];
  const maxPp = Math.max(...safe.map((b) => parseFloat(b.weight_pp)), 0);
  return (
    <div className="instrument-panel rounded-lg p-4">
      <h3 className="text-sm font-medium text-ink">Top restore-levers</h3>
      <p className="mt-0.5 text-xs text-faint">
        Points recoverable if each row reached 3, in head-line points.
      </p>
      <ul className="mt-3 space-y-2.5">
        {safe.map((b) => {
          const pp = parseFloat(b.weight_pp);
          const reg = INDICATOR_REGISTRY[b.row];
          const effort = verifyEffortLabel(reg?.effort);
          const quickWin = (reg?.remediation?.quick_win ?? "").trim();
          const excerpt = truncateQuickWin(quickWin);
          const href = tryIndicatorHref(b.row);
          return (
            <li key={b.row}>
              <a href={`#row-${b.row}`} className="block rounded p-1 -m-1 hover:bg-panel-raised/50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-foreground/30">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-xs text-muted">
                    <span className="text-faint">{b.row}</span> · {b.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded border border-hairline bg-panel-raised px-1 py-0 text-[10px] text-faint">{effort}</span>
                    <span className="font-mono text-xs text-tier-moderate">+{b.weight_pp}</span>
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel-raised">
                  <div
                    className="h-full rounded-full bg-tier-moderate"
                    style={{ width: `${(pp / maxPp) * 100}%` }}
                  />
                </div>
                <p className="mt-0.5 truncate text-xs text-faint">{b.summary}</p>
                {excerpt ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
                    <span className="text-faint">↳</span> {excerpt}
                  </p>
                ) : null}
              </a>
              {href ? (
                <div className="mt-1 flex justify-end">
                  <Link
                    href={href}
                    className="cursor-pointer rounded text-[11px] text-faint underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
                  >
                    rubric definition →
                  </Link>
                </div>
              ) : null}
            </li>
          );
        })}
        {safe.length === 0 && (
          <li className="text-xs text-faint">
            No recoverable points — top of the band.
          </li>
        )}
      </ul>
    </div>
  );
}

export function DeepDiveScope({ scope }: { scope?: DeepDiveScopeEntry[] }) {
  const safe = scope ?? [];
  return (
    <div className="instrument-panel rounded-lg p-4">
      <h3 className="text-sm font-medium text-ink">
        Not run in a standard audit
      </h3>
      <p className="mt-0.5 text-xs text-faint">
        18 deep-dive rows fold into the category when you order one.
      </p>
      <ul className="mt-3 space-y-2">
        {safe.map((s) => {
          const href = tryIndicatorHref(s.row);
          return (
          <li key={s.row} className="text-xs">
            {href ? (
              <Link
                href={href}
                className="cursor-pointer rounded font-mono text-faint underline underline-offset-2 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/40"
              >
                {s.row}
              </Link>
            ) : (
              <span className="font-mono text-faint">{s.row}</span>
            )}{" "}
            <span className="text-muted">{s.name}</span>
            <span className="block pl-6 text-faint">{s.what_it_takes}</span>
          </li>
          );
        })}
        {safe.length === 0 && <li className="text-xs text-faint">No deep-dive scope — all rows measured in this phase.</li>}
      </ul>
    </div>
  );
}
