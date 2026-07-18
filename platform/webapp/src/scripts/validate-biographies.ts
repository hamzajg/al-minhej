import type { KnowledgeNode } from "../domain/types";
import { validateNarratorBiographies, generateValidationReport } from "../domain/BiographyValidator";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const narratorsDir = path.join(__dirname, "../../public/api/v1/nodes/NARRATOR");
const nodes: KnowledgeNode[] = [];

for (const dir of fs.readdirSync(narratorsDir)) {
  const filePath = path.join(narratorsDir, dir, "node.json");
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    try {
      const node = JSON.parse(content) as KnowledgeNode;
      nodes.push(node);
    } catch (e) {
      console.error(`Failed to parse ${filePath}:`, e);
    }
  }
}

console.log(`Loaded ${nodes.length} narrator nodes`);

const results = validateNarratorBiographies(nodes);
console.log(generateValidationReport(results));

// Check for primary references
for (const result of results) {
  if (result.warnings.some(w => w.code === "NO_PRIMARY_REFERENCES")) {
    console.log(`\nWARNING: ${result.narratorName} (${result.narratorId}) has no primary references`);
  }
}
