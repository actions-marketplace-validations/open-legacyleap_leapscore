import fs from "fs";
import path from "path";

const RUBRIC_DIR = path.resolve(process.cwd(), "..", "..", "docs/rubric");

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

export function parseRubric(): Category[] {
  try {
    const files = fs.readdirSync(RUBRIC_DIR).filter(f => f.match(/^(0[1-9]|10)_.*\.md$/));
    
    return files.map(file => {
      const content = fs.readFileSync(path.join(RUBRIC_DIR, file), "utf-8");
      const lines = content.split("\n");
      
      const categoryName = lines[0].replace(/^# \d{2} — /, "").replace(/\*.*?\*/g, "").trim();
      const categoryId = file.split("_")[0];
      
      let summary = "";
      let thesis = "";
      let weightBase = "";
      let weightFE = "";
      let indicatorCounts = "";
      
      for (const line of lines) {
        if (line.includes("**One-line thesis:**")) thesis = line.split("**One-line thesis:**")[1].trim();
        if (line.includes("**Category summary:**")) summary = line.split("**Category summary:**")[1].trim();
        if (line.includes("> **Weight:**")) {
            const parts = line.split("·");
            weightBase = parts[0].split("**Weight:**")[1].trim();
            weightFE = parts[1].trim();
            indicatorCounts = parts.slice(2).join(" · ").trim();
        }
      }
      
      const indicators: Indicator[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("### ")) {
          const match = line.match(/### ([A-Z0-9-]+) [—–-–] (.*)/);
          if (match) {
            const [_, id, name] = match;
            
            let data: Partial<Indicator> = { id, name };
            
            // Extract the engine fields line first
            for (let j = i + 1; j < i + 3; j++) {
                if (lines[j]?.includes("**Engine tier:**")) {
                    const parts = lines[j].split("·");
                    data.engineTier = parts[0].split("**Engine tier:**")[1].trim();
                    data.defaultStatus = parts[1].split("**Default status:**")[1].trim();
                    data.scopeOverlaps = parts[2].split("**Scope/overlaps:**")[1].trim();
                }
            }

            // Extract content lines
            for (let j = i + 1; j < i + 30; j++) {
              if (!lines[j]) continue;
              if (lines[j].includes("- **Definition:**")) data.definition = lines[j].split("- **Definition:**")[1].trim();
              if (lines[j].includes("- **Why it matters:**")) data.whyItMatters = lines[j].split("- **Why it matters:**")[1].trim();
              if (lines[j].includes("- **Detection method:**")) data.detectionMethod = lines[j].split("- **Detection method:**")[1].trim();
              if (lines[j].includes("- **Yellow flag")) data.yellowFlag = lines[j].split("):")[1].trim();
              if (lines[j].includes("- **Red flag")) data.redFlag = lines[j].split("):")[1].trim();
              if (lines[j].includes("- **Remediation playbook:**")) data.remediation = lines[j].split("- **Remediation playbook:**")[1].trim();
              if (lines[j].includes("- **Scoring criteria")) data.scoringCriteria = lines[j].split("):")[1].trim();
              if (lines[j].includes("- **Verify effort:**")) data.verifyEffort = lines[j].split("- **Verify effort:**")[1].trim();
            }
            
            indicators.push(data as Indicator);
          }
        }
      }
      
      return { id: categoryId, name: categoryName, summary, thesis, weightBase, weightFE, indicatorCounts, indicators };
    });
  } catch (e) {
    console.error("Error parsing rubric:", e);
    return [];
  }
}
