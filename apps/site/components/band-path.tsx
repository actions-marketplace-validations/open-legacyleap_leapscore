import { bandPathBlock, type NextBandPath } from "@leapscore/contracts";

/**
 * Sealed next-band path block (spec: band-path, report-rendering).
 * Renders the destination and distance, the steps grouped by cost class with
 * their cumulative arrival states, the unreached-row disclosure, and the stated
 * applicability assumption — all mapped from the shared `bandPathBlock` model,
 * so the site and the CLI reports cannot drift. A report with no path (for
 * example a suppressed headline) renders no block at all; a terminal path
 * renders the band-accomplished statement instead of an empty list.
 */
export function BandPath({
  path,
  tier,
  score,
}: {
  path?: NextBandPath;
  tier: string;
  score: number;
}) {
  if (!path) return null;
  const block = bandPathBlock(path, { tier, score });
  return (
    <section
      className="instrument-panel rounded-lg p-4"
      aria-label={block.heading}
    >
      <h3 className="text-sm font-medium text-ink">{block.heading}</h3>
      <p className="mt-0.5 text-sm text-muted">{block.statement}</p>
      {block.classes.length > 0 ? (
        <div className="mt-3 space-y-4">
          {block.classes.map((c) => (
            <div key={c.tag}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm text-ink">{c.tag}</span>
                  <span className="text-sm font-medium text-ink">
                    {c.verify}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted">
                  {c.total} · cumulative {c.cumulative}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-faint">{c.arrival}</p>
              <ul className="mt-2 space-y-1.5">
                {c.steps.map((s) => (
                  <li key={s.row}>
                    <a
                      href={`#row-${s.row}`}
                      className="block rounded border border-hairline bg-background/40 p-2 hover:bg-panel-raised/40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-foreground/30"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-mono text-xs text-muted">
                          <span className="text-faint">{s.row}</span> · {s.name}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-tier-moderate">
                          {s.pp}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-faint">
                        {s.verify}
                      </div>
                      {s.quick_win ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">
                          <span className="text-faint">Quick win:</span>{" "}
                          {s.quick_win}
                        </p>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      {block.shortfall ? (
        <p className="mt-3 text-xs text-tier-high">{block.shortfall}</p>
      ) : null}
      {block.unreached ? (
        <p className="mt-2 text-xs text-faint">{block.unreached}</p>
      ) : null}
      <p className="mt-3 text-[11px] italic text-faint">{block.assumption}</p>
    </section>
  );
}
