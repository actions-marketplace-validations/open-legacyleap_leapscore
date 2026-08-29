/** engine/archetype.ts — repo archetype + plane inventory (B layer) */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export type Archetype = 'library' | 'service' | 'cli' | 'infra' | 'docs' | 'agent-skills' | 'mixed' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export interface PlaneInventory {
  has_server: boolean;
  has_data: boolean;
  has_deploy: boolean;
  has_client: boolean;
  has_test: boolean;
  evidence: Record<keyof Omit<PlaneInventory, 'evidence'>, string[]>;
}

export interface ArchetypeResult {
  archetype: Archetype;
  confidence: Confidence;
  evidencePointers: string[];
  planeInventory: PlaneInventory;
  perRoot?: Array<{ root: string; archetype: Archetype; confidence: Confidence; planeInventory: PlaneInventory; evidencePointers: string[] }>;
}

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}

async function readJsonIfExists(clonePath: string, rel: string, readFile: (p: string) => Promise<Buffer | null>): Promise<Record<string, unknown> | null> {
  try {
    const buf = await readFile(rel);
    if (!buf) return null;
    return JSON.parse(buf.toString('utf-8')) as Record<string, unknown>;
  } catch { return null; }
}

async function listFilesRecursive(clonePath: string, maxDepth = 3): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string, depth: number, relBase: string) {
    if (depth > maxDepth) return;
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.') && e.name !== '.github') continue;
        if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'build' || e.name === '.next') continue;
        const full = join(dir, e.name);
        const rel = relBase ? `${relBase}/${e.name}` : e.name;
        if (e.isDirectory()) {
          out.push(rel + '/');
          await walk(full, depth + 1, rel);
        } else {
          out.push(rel);
        }
      }
    } catch {}
  }
  await walk(clonePath, 0, '');
  return out;
}

function hasAnyFile(files: string[], patterns: string[]): string[] {
  const found: string[] = [];
  for (const pat of patterns) {
    if (pat.endsWith('/')) {
      const hit = files.find(f => f.startsWith(pat) || f === pat);
      if (hit) found.push(pat);
    } else if (pat.includes('*')) {
      const rx = new RegExp('^' + pat.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      const hit = files.find(f => rx.test(f));
      if (hit) found.push(hit);
    } else {
      if (files.includes(pat) || files.some(f => f.endsWith('/' + pat) || f === pat))
        found.push(pat);
    }
  }
  return found;
}

export async function detectPlaneInventory(clonePath: string, readFile: (p: string) => Promise<Buffer | null>): Promise<PlaneInventory> {
  const files = await listFilesRecursive(clonePath);
  const evidence: Record<string, string[]> = {
    has_server: [],
    has_data: [],
    has_deploy: [],
    has_client: [],
    has_test: [],
  };

  // has_server — server framework deps in manifest
  const serverDeps = ['express','fastify','koa','hapi','nestjs','django','flask','fastapi','spring-boot','gin','fiber','rails','actix','axum','laravel'];
  let has_server = false;
  const manifestCandidates = ['package.json','pyproject.toml','requirements.txt','go.mod','Cargo.toml','pom.xml','Gemfile','composer.json'];
  for (const m of manifestCandidates) {
    const buf = await readFile(m);
    if (buf) {
      const txt = buf.toString('utf-8').toLowerCase();
      for (const dep of serverDeps) {
        if (txt.includes(dep)) { has_server = true; evidence.has_server.push(`${m}: ${dep}`); break; }
      }
    }
  }
  // entrypoint files
  const serverFiles = hasAnyFile(files, ['server.js','server.ts','app.js','app.py','main.go','src/server','api/server','server/']);
  if (serverFiles.length) { has_server = true; evidence.has_server.push(...serverFiles); }

  // has_data — migrations, schema.sql, prisma, DB drivers
  const dataFiles = hasAnyFile(files, ['migrations/','migrate/','db/migrate/','schema.sql','prisma/schema.prisma','prisma/','alembic.ini','alembic/']);
  if (dataFiles.length) { evidence.has_data.push(...dataFiles); }
  let has_data = dataFiles.length > 0;
  const dbDrivers = ['pg','mysql','prisma','sqlalchemy','knex','sequelize','typeorm','drizzle','mongoose','psycopg','pymysql','diesel','sqlx'];
  for (const m of manifestCandidates) {
    const buf = await readFile(m);
    if (buf) {
      const txt = buf.toString('utf-8').toLowerCase();
      for (const d of dbDrivers) {
        if (txt.includes(d)) { has_data = true; evidence.has_data.push(`${m}: ${d}`); break; }
      }
    }
  }

  // has_deploy — Dockerfile, k8s, tf, serverless, helm
  const deployPatterns = ['Dockerfile','docker-compose.yml','docker-compose.yaml','k8s/','.k8s/','kubernetes/','serverless.yml','serverless.yaml','Chart.yaml','helm/','.terraform/'];
  const deployFiles = hasAnyFile(files, deployPatterns);
  const tfFiles = files.filter(f => f.endsWith('.tf'));
  if (deployFiles.length) evidence.has_deploy.push(...deployFiles);
  if (tfFiles.length) evidence.has_deploy.push(...tfFiles.slice(0,3));
  let has_deploy = deployFiles.length > 0 || tfFiles.length > 0;

  // has_client — react/vue/svelte/angular or src/components
  const clientDeps = ['react','vue','svelte','angular','next','nuxt','solid-js','preact'];
  let has_client = false;
  for (const m of ['package.json']) {
    const buf = await readFile(m);
    if (buf) {
      const txt = buf.toString('utf-8').toLowerCase();
      for (const c of clientDeps) {
        if (txt.includes(`"${c}"`) || txt.includes(`'${c}'`) || txt.includes(`${c}@`)) { has_client = true; evidence.has_client.push(`${m}: ${c}`); }
      }
    }
  }
  const clientFiles = hasAnyFile(files, ['src/components/','components/','frontend/','web/','client/']);
  if (clientFiles.length) { has_client = true; evidence.has_client.push(...clientFiles); }

  // has_test — __tests__, tests/, *.test.*, *.spec.*, jest, pytest, vitest
  const testFiles = hasAnyFile(files, ['__tests__/','tests/','test/','*.test.js','*.test.ts','*.spec.js','*.spec.ts','*.test.py']);
  const testConfigs = hasAnyFile(files, ['jest.config.js','jest.config.ts','vitest.config.ts','pytest.ini','pyproject.toml','tox.ini']);
  // also check for test keywords in package.json
  let has_test = testFiles.length > 0;
  if (testConfigs.length) {
    // need to verify config actually mentions test
    for (const c of testConfigs) {
      const buf = await readFile(c);
      if (buf && buf.toString('utf-8').toLowerCase().includes('test')) { has_test = true; evidence.has_test.push(c); }
    }
  }
  if (testFiles.length) evidence.has_test.push(...testFiles.slice(0,3));
  // fallback: check files ending with test spec
  const anyTestFile = files.some(f => f.includes('.test.') || f.includes('.spec.') || f.includes('__tests__'));
  if (anyTestFile) has_test = true;

  // Exhaustive evidence for false planes — record tree scan proof
  if (!has_server) evidence.has_server.push('tree scan: 0 matches for {server deps, server.* entrypoints}');
  if (!has_data) evidence.has_data.push('tree scan: 0 matches for {migrations/, schema.sql, prisma/, db-drivers}');
  if (!has_deploy) evidence.has_deploy.push('tree scan: 0 matches for {Dockerfile, k8s/, *.tf, serverless.yml, Chart.yaml}');
  if (!has_client) evidence.has_client.push('tree scan: 0 matches for {client deps, src/components/}');
  if (!has_test) evidence.has_test.push('tree scan: 0 matches for {__tests__/, tests/, *.test.*, jest/pyproject test config}');

  return { has_server, has_data, has_deploy, has_client, has_test, evidence: evidence as PlaneInventory['evidence'] };
}

export async function classifyArchetype(clonePath: string, readFile: (p: string) => Promise<Buffer | null>, manifests: Array<{ root: string; ecosystem: string }>): Promise<ArchetypeResult> {
  const plane = await detectPlaneInventory(clonePath, readFile);
  const files = await listFilesRecursive(clonePath);

  // Gather manifest signals
  const pkgJson = await readJsonIfExists(clonePath, 'package.json', readFile);
  const hasMain = pkgJson && (pkgJson.main || pkgJson.exports || (pkgJson as Record<string, unknown>).module);
  const hasBin = pkgJson && pkgJson.bin;
  const hasScripts = pkgJson && pkgJson.scripts as Record<string, unknown> | undefined;
  const isPrivate = pkgJson && (pkgJson.private === true);

  // Detect docs-heavy
  const mdCount = files.filter(f => f.endsWith('.md')).length;
  const codeCount = files.filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.py') || f.endsWith('.go') || f.endsWith('.java') || f.endsWith('.rs')).length;
  const mdRatio = codeCount === 0 ? (mdCount > 0 ? 1 : 0) : mdCount / (mdCount + codeCount);

  // Detect agent-skills
  const skillsFiles = hasAnyFile(files, ['skills/','agents/','prompts/','.cursor/']);
  const skillMd = files.filter(f => (f.startsWith('skills/') || f.startsWith('agents/')) && f.endsWith('.md')).length;

  // Detect infra
  const tfCount = files.filter(f => f.endsWith('.tf')).length;
  const infraFiles = hasAnyFile(files, ['infra/','terraform/','.terraform/','ansible/','k8s/','helm/']);

  // Decision tree — deterministic, evidence-backed
  const pointers: string[] = [];
  let archetype: Archetype = 'unknown';
  let confidence: Confidence = 'low';

  if (skillsFiles.length > 0 && skillMd > 0 && !plane.has_server && !plane.has_deploy) {
    archetype = 'agent-skills';
    confidence = skillMd >= 3 ? 'high' : 'medium';
    pointers.push(`skills/: ${skillMd} md prompts`);
    if (!plane.has_server) pointers.push('no server deps');
    if (!plane.has_deploy) pointers.push('no Dockerfile/k8s/tf');
  } else if (tfCount >= 2 || (infraFiles.length >= 2 && !plane.has_server && plane.has_deploy)) {
    archetype = 'infra';
    confidence = tfCount >= 3 ? 'high' : 'medium';
    pointers.push(...infraFiles.slice(0,2), ...tfCount ? [`${tfCount} *.tf files`] : []);
  } else if (mdRatio > 0.6 && mdCount >= 3 && !plane.has_server && !plane.has_data && codeCount < 10) {
    archetype = 'docs';
    confidence = mdRatio > 0.8 ? 'high' : 'medium';
    pointers.push(`md/(md+code) ${Math.round(mdRatio*100)}%`);
    if (!plane.has_server) pointers.push('no server');
  } else if (hasBin && !plane.has_server) {
    archetype = 'cli';
    confidence = 'medium';
    pointers.push('package.json: bin');
    if (hasMain) pointers.push('package.json: main/exports');
  } else if (hasMain && !isPrivate && !plane.has_deploy && !plane.has_server) {
    // library: has main/exports, private false, no deploy/server
    archetype = 'library';
    confidence = hasMain ? 'high' : 'medium';
    pointers.push('package.json: main/exports');
    if (!plane.has_deploy) pointers.push('no Dockerfile/k8s/tf');
    if (!plane.has_data) pointers.push('no migrations/ nor DB driver');
  } else if (plane.has_server || (plane.has_data && plane.has_deploy)) {
    archetype = 'service';
    confidence = plane.has_server && plane.has_data && plane.has_deploy ? 'high' : 'medium';
    if (plane.has_server) pointers.push(plane.evidence.has_server[0]);
    if (plane.has_data) pointers.push(plane.evidence.has_data[0]);
    if (plane.has_deploy) pointers.push(plane.evidence.has_deploy[0]);
  } else if (manifests.length === 0 && !plane.has_server && !plane.has_data && !plane.has_deploy && !plane.has_client) {
    archetype = 'unknown';
    confidence = 'low';
    pointers.push('no recognizable manifest and no plane signal');
  } else {
    // fallback: infer from planes
    if (plane.has_server) { archetype = 'service'; confidence = 'low'; pointers.push('has_server true'); }
    else if (hasMain) { archetype = 'library'; confidence = 'low'; pointers.push('has main but ambiguous'); }
    else { archetype = 'unknown'; confidence = 'low'; pointers.push('ambiguous — default unknown'); }
  }

  // If no high-confidence signals, downgrade to low
  if (pointers.length === 0) { archetype = 'unknown'; confidence = 'low'; }

  return { archetype, confidence, evidencePointers: pointers, planeInventory: plane };
}

export async function classifyArchetypePerRoot(
  clonePath: string,
  readFile: (p: string) => Promise<Buffer | null>,
  manifests: Array<{ root: string; ecosystem: string }>
): Promise<ArchetypeResult> {
  // If multi-root manifests, classify per root
  if (manifests.length <= 1) {
    return classifyArchetype(clonePath, readFile, manifests);
  }
  const perRoot: ArchetypeResult['perRoot'] = [];
  for (const m of manifests) {
    // For per-root, create a scoped readFile
    const scopedRead = async (p: string) => readFile(m.root === '.' ? p : `${m.root}/${p}`);
    const scopedPath = m.root === '.' ? clonePath : join(clonePath, m.root);
    // check if path exists
    if (!(await exists(scopedPath))) continue;
    const res = await classifyArchetype(scopedPath, scopedRead, [m]);
    perRoot.push({ root: m.root, archetype: res.archetype, confidence: res.confidence, planeInventory: res.planeInventory, evidencePointers: res.evidencePointers });
  }
  // mixed if distinct archetypes
  const distinct = new Set(perRoot.map(r => r.archetype));
  const topArchetype: Archetype = distinct.size > 1 ? 'mixed' : (perRoot[0]?.archetype ?? 'unknown');
  const confidence: Confidence = perRoot.every(r => r.confidence === 'high') ? 'high' : perRoot.some(r => r.confidence === 'low') ? 'low' : 'medium';
  const plane: PlaneInventory = {
    has_server: perRoot.some(r => r.planeInventory.has_server),
    has_data: perRoot.some(r => r.planeInventory.has_data),
    has_deploy: perRoot.some(r => r.planeInventory.has_deploy),
    has_client: perRoot.some(r => r.planeInventory.has_client),
    has_test: perRoot.some(r => r.planeInventory.has_test),
    evidence: {
      has_server: perRoot.flatMap(r => r.planeInventory.evidence.has_server).slice(0,2),
      has_data: perRoot.flatMap(r => r.planeInventory.evidence.has_data).slice(0,2),
      has_deploy: perRoot.flatMap(r => r.planeInventory.evidence.has_deploy).slice(0,2),
      has_client: perRoot.flatMap(r => r.planeInventory.evidence.has_client).slice(0,2),
      has_test: perRoot.flatMap(r => r.planeInventory.evidence.has_test).slice(0,2),
    },
  };
  return {
    archetype: topArchetype,
    confidence,
    evidencePointers: perRoot.map(r => `${r.root}: ${r.archetype}`),
    planeInventory: plane,
    perRoot,
  };
}
