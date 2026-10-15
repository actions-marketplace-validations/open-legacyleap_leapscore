/** Per-client scan admission control (scan-api: Scan admission control). */
export class AdmissionController {
  private starts = new Map<string, number[]>();
  private inflight = new Map<string, number>();
  constructor(
    private maxStartsPerWindow = 10,
    private windowMs = 60_000,
    private maxConcurrent = 3,
  ) {}

  private prune(ip: string, now: number): number[] {
    const kept = (this.starts.get(ip) ?? []).filter((t) => now - t < this.windowMs);
    this.starts.set(ip, kept);
    return kept;
  }

  /** Returns true when the scan may start (no GH/clone work otherwise). */
  tryAdmit(ip: string, now = Date.now()): boolean {
    const recent = this.prune(ip, now);
    if (recent.length >= this.maxStartsPerWindow) return false;
    if ((this.inflight.get(ip) ?? 0) >= this.maxConcurrent) return false;
    recent.push(now);
    this.starts.set(ip, recent);
    this.inflight.set(ip, (this.inflight.get(ip) ?? 0) + 1);
    return true;
  }

  release(ip: string): void {
    this.inflight.set(ip, Math.max(0, (this.inflight.get(ip) ?? 1) - 1));
  }
}
