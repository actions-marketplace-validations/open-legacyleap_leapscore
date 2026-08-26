/** engine/ecosystem.ts — path-scoped manifest sniff (05 §3, Q4) */
// Sniffs per root: package-lock.json / pyproject.toml / go.mod / pom.xml / Cargo.toml / *.csproj / Gemfile / composer.json.
// Output: { root, ecosystem, lockfile, manifest }[]; [] = agnostic-only (D6 polyglot-safe).
// Stub.

export type Manifest = { root: string; ecosystem: string; lockfile: string; manifest: string };
export async function sniffEcosystems(_clonePath: string): Promise<Manifest[]> { return []; }
