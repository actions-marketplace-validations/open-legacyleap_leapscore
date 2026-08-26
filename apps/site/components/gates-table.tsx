import type { Gate, GateStatus } from "@/lib/types";

const STATUS: Record<GateStatus, { label: string; dot: string; note: string }> =
  {
    proven: {
      label: "Proven",
      dot: "bg-tier-healthy",
      note: "Red flag confirmed — verdict is capped.",
    },
    "needs-verification": {
      label: "Needs verification",
      dot: "bg-tier-moderate",
      note: "Borderline red flag — can't confirm from code alone.",
    },
    "not-proven": {
      label: "Not proven",
      dot: "bg-foreground",
      note: "No red flag — gate does not cap the verdict.",
    },
  };

export function GatesTable({ gates }: { gates: Gate[] }) {
  return (
    <div className="instrument-panel overflow-hidden rounded-lg">
      <div className="border-b border-hairline px-4 py-3">
        <h3 className="text-sm font-medium text-ink">Kill-switch gates</h3>
        <p className="mt-0.5 text-xs text-faint">
          G1–G8 red-flag checks. Any proven gate caps the verdict at High Risk.
        </p>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {gates.map((g) => {
            const s = STATUS[g.status];
            return (
              <tr key={g.id} className="border-b border-hairline last:border-0">
                <td className="w-12 px-4 py-3 align-top font-mono text-xs text-faint">
                  {g.id}
                </td>
                <td className="px-2 py-3 align-top">
                  <div className="font-medium text-foreground">{g.name}</div>
                  <div className="mt-0.5 text-xs text-muted">{g.note}</div>
                  <div className="mt-1 font-mono text-[11px] text-faint">
                    {g.source_rows.join(", ")}
                  </div>
                </td>
                <td className="w-40 px-4 py-3 text-right align-top">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted"
                    title={s.note}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
