import fs from "fs";
import path from "path";

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
 * Parse one canonical unified indicator file (`docs/rubric/indicators/<NN_CATEGORY>/<ID>_*.md`).
 * The unified skeleton is the single source; this reads the human-facing fields the
 * rubric browser renders.
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

export function parseRubric(): Category[] {
  try {
    const files = fs
      .readdirSync(RUBRIC_DIR)
      .filter((f) => f.match(/^(0[1-9]|10)_.*\.md$/))
      .sort();
    const categoryDirs = fs.readdirSync(INDICATORS_DIR).sort();

    return files.map((file) => {
      const content = fs.readFileSync(path.join(RUBRIC_DIR, file), "utf-8");
      const lines = content.split("\n");

      const categoryId = file.split("_")[0];
      const categoryName = lines[0].replace(/^# \d{2} — /, "").trim();

      let summary = "";
      let thesis = "";
      let weightBase = "";
      let weightFE = "";
      let indicatorCounts = "";

      for (const line of lines) {
        if (line.includes("**Thesis:**")) thesis = line.split("**Thesis:**")[1].trim();
        if (line.includes("**Category summary:**")) summary = line.split("**Category summary:**")[1].trim();
        const weights = line.match(/Base weight:\s*(.+?)\s*·\s*FE-active weight:\s*(.+?)\s*·\s*(.+)$/);
        if (weights) {
          weightBase = weights[1].trim();
          weightFE = weights[2].trim();
          indicatorCounts = weights[3].trim();
        }
      }

      const categoryDir = categoryDirs.find((dir) => dir.startsWith(`${categoryId}_`));
      const indicators: Indicator[] = categoryDir
        ? fs
            .readdirSync(path.join(INDICATORS_DIR, categoryDir))
            .filter((entry) => entry.endsWith(".md"))
            .sort()
            .map((entry) => parseIndicator(path.join(INDICATORS_DIR, categoryDir, entry)))
            .filter((indicator): indicator is Indicator => indicator !== null)
        : [];

      return { id: categoryId, name: categoryName, summary, thesis, weightBase, weightFE, indicatorCounts, indicators };
    });
  } catch (e) {
    console.error("Error parsing rubric:", e);
    return [];
  }
}
