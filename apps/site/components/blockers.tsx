import type { DeepDiveScopeEntry, TopBlocker } from "@/lib/types";

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
          return (
            <li key={b.row}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-xs text-muted">
                  <span className="text-faint">{b.row}</span> · {b.name}
                </span>
                <span className="shrink-0 font-mono text-xs text-tier-moderate">
                  +{b.weight_pp}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-panel-raised">
                <div
                  className="h-full rounded-full bg-tier-moderate"
                  style={{ width: `${(pp / maxPp) * 100}%` }}
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-faint">{b.summary}</p>
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
        {safe.map((s) => (
          <li key={s.row} className="text-xs">
            <span className="font-mono text-faint">{s.row}</span>{" "}
            <span className="text-muted">{s.name}</span>
            <span className="block pl-6 text-faint">{s.what_it_takes}</span>
          </li>
        ))}
        {safe.length === 0 && <li className="text-xs text-faint">No deep-dive scope — all rows measured in this phase.</li>}
      </ul>
    </div>
  );
}
