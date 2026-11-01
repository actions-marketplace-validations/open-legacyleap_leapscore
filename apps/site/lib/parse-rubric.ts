import fs from "fs";
import path from "path";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_WEIGHTS,
  INDICATOR_REGISTRY,
} from "./generated/rubric";

const RUBRIC_DIR = path.resolve(process.cwd(), "..", "..", "docs/rubric");
const INDICATORS_DIR = path.join(RUBRIC_DIR, "indicators");

export interface Indicator {
  id: string;
  name: string;
  definition: string;
  whyItMatters: string;
  detectionMethod: string;
  yellowFlag: string;
  redFlag: string;
  remediation: string;
  scoringCriteria: string;
  verifyEffort: string;
  engineTier: string;
  defaultStatus: string;
  scopeOverlaps: string;
}

export interface Category {
  id: string;
  name: string;
  summary: string;
  thesis: string;
  weightBase: string;
  weightFE: string;
  indicatorCounts: string;
  indicators: Indicator[];
}

/**
 * Parse one canonical indicator file (`docs/rubric/indicators/<NN-slug>/<ID>-<slug>.md`).
 * The unified skeleton is the single source of the human-facing prose the browser renders;
 * category order, labels, weights, and membership come from the generated registry.
 */
function parseIndicator(file: string): Indicator | null {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");

  const title = lines.find((line) => line.startsWith("# "));
  const match = title?.match(/^# ([A-Z]+-\d+) [—–-] (.+)$/);
  if (!match) return null;

  const bullets = new Map<string, string>();
  const table = new Map<string, string>();
  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^- \*\*(.+?):\*\*\s*(.*)$/);
    if (bullet) {
      if (!bullets.has(bullet[1])) bullets.set(bullet[1], bullet[2].trim());
      continue;
    }
    const cell = line.match(/^\| ([^|]+?) \| ([^|]+?) \|$/);
    if (cell && !table.has(cell[1].trim())) table.set(cell[1].trim(), cell[2].trim());
  }

  const bulletValue = (prefix: string): string => {
    for (const [key, value] of bullets) if (key.startsWith(prefix)) return value;
    return "";
  };

  let scopeOverlaps = "";
  const scopeIndex = lines.findIndex((line) => line.trim() === "### Scope/overlaps");
  if (scopeIndex >= 0) {
    const prose: string[] = [];
    for (let i = scopeIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#")) break;
      if (line) prose.push(line);
    }
    scopeOverlaps = prose.join(" ");
  }

  return {
    id: match[1],
    name: match[2].trim(),
    definition: bulletValue("Definition"),
    whyItMatters: bulletValue("Why it signals obsolescence") || bulletValue("Why it matters"),
    detectionMethod: bulletValue("Detection method"),
    yellowFlag: bulletValue("Yellow flag"),
    redFlag: bulletValue("Red flag"),
    remediation: bulletValue("Remediation playbook"),
    scoringCriteria: bulletValue("Scoring criteria"),
    verifyEffort: table.get("Verify effort") ?? "",
    engineTier: table.get("Engine tier") ?? "",
    defaultStatus: table.get("Default status") ?? "",
    scopeOverlaps,
  };
}

/** Category directory names, keyed by their two-digit order prefix. */
function categoryDirs(): Map<string, string> {
  const dirs = new Map<string, string>();
  for (const entry of fs.readdirSync(INDICATORS_DIR)) {
    const match = entry.match(/^(\d{2})-/);
    if (match) dirs.set(match[1], entry);
  }
  return dirs;
}

/** The charter's thesis and membership line — prose the registry does not carry. */
function charterProse(file: string): { thesis: string; summary: string; counts: string } {
  if (!fs.existsSync(file)) return { thesis: "", summary: "", counts: "" };
  const lines = fs.readFileSync(file, "utf-8").split("\n");
  let thesis = "";
  let summary = "";
  let counts = "";
  for (const line of lines) {
    if (line.includes("**Thesis:**")) thesis = line.split("**Thesis:**")[1].trim();
    if (line.includes("**Category summary:**")) summary = line.split("**Category summary:**")[1].trim();
    const membership = line.match(/Standard indicators:\s*(.+?)\s*·\s*Deep-dive indicators:\s*(.+)$/);
    if (membership) {
      counts = `Standard indicators: ${membership[1].trim()} · Deep-dive indicators: ${membership[2].trim()}`;
    }
  }
  return { thesis, summary, counts };
}

export function parseRubric(): Category[] {
  try {
    const dirs = categoryDirs();
    const byCategory = new Map<string, string[]>();
    for (const meta of Object.values(INDICATOR_REGISTRY)) {
      const ids = byCategory.get(meta.category) ?? [];
      ids.push(meta.id);
      byCategory.set(meta.category, ids);
    }

    return CATEGORY_ORDER.map((code, index) => {
      // The category id is the site's public key (/rubric/01) and the tree's order prefix.
      const id = String(index + 1).padStart(2, "0");
      const dir = dirs.get(id);
      const dirPath = dir ? path.join(INDICATORS_DIR, dir) : "";
      const prose = dirPath ? charterProse(path.join(dirPath, "README.md")) : { thesis: "", summary: "", counts: "" };

      const ids = (byCategory.get(code) ?? []).sort(
        (a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]),
      );
      const files = dirPath ? fs.readdirSync(dirPath) : [];
      const indicators: Indicator[] = ids
        .map((indicatorId) => {
          const file = files.find((entry) => entry.startsWith(`${indicatorId}-`));
          return file ? parseIndicator(path.join(dirPath, file)) : null;
        })
        .filter((indicator): indicator is Indicator => indicator !== null);

      const weights = CATEGORY_WEIGHTS[code];
      const weightBase = weights?.base == null ? "conditional" : `${weights.base}%`;
      const weightFE = weights?.feActive == null ? "conditional" : `${weights.feActive}%`;

      return {
        id,
        name: CATEGORY_LABELS[code] ?? code,
        summary: prose.summary,
        thesis: prose.thesis,
        weightBase,
        weightFE,
        indicatorCounts: prose.counts || `${indicators.length} indicators`,
        indicators,
      };
    });
  } catch (e) {
    console.error("Error parsing rubric:", e);
    return [];
  }
}
