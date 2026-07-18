import type { KnowledgeNode, BiographyBlock } from "@/domain/types";

export interface BiographyValidationResult {
  narratorId: string;
  narratorName: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  path: string;
}

export interface ValidationWarning {
  code: ValidationWarningCode;
  message: string;
  path: string;
}

export type ValidationErrorCode =
  | "NO_BIOGRAPHICAL_REFERENCES"
  | "INVALID_PROVENANCE"
  | "DUPLICATE_WORK_TITLE";

export type ValidationWarningCode =
  | "NO_PRIMARY_REFERENCES"
  | "LOW_CONFIDENCE_REFERENCES";

export function validateNarratorBiographies(nodes: KnowledgeNode[]): BiographyValidationResult[] {
  const results: BiographyValidationResult[] = [];

  for (const node of nodes) {
    if (node.type !== "NARRATOR" || node.status !== "published") {
      continue;
    }

    const biographyBlock = node.content.find(
      (block): block is BiographyBlock => block.type === "biography"
    );

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for >=1 biographicalReferences entry
    if (!biographyBlock || !biographyBlock.biographicalReferences || biographyBlock.biographicalReferences.length === 0) {
      errors.push({
        code: "NO_BIOGRAPHICAL_REFERENCES",
        message: "Biography block has no biographicalReferences entries",
        path: "content[0].biographicalReferences"
      });
    }

    // Check each entry for valid provenance and validate work titles
    if (biographyBlock?.biographicalReferences) {
      const workTitles: string[] = [];
      let hasPrimaryReference = false;
      
      for (let i = 0; i < biographyBlock.biographicalReferences.length; i++) {
        const ref = biographyBlock.biographicalReferences[i];
        const basePath = `content[0].biographicalReferences[${i}]`;

        // Validate provenance
        if (!ref.provenance) {
          errors.push({
            code: "INVALID_PROVENANCE",
            message: "Biographical reference has no provenance",
            path: `${basePath}.provenance`
          });
        }

        // Track work titles for deduplication
        if (ref.workTitle && ref.workTitle.ar) {
          if (workTitles.includes(ref.workTitle.ar)) {
            errors.push({
              code: "DUPLICATE_WORK_TITLE",
              message: `Duplicate workTitle found: "${ref.workTitle.ar}"`,
              path: `${basePath}.workTitle.ar`
            });
          }
          workTitles.push(ref.workTitle.ar);
        }

        // Check if reference is primary
        if (ref.provenance === "primary") {
          hasPrimaryReference = true;
        }
      }

      // Warning for narrators without primary references
      if (!hasPrimaryReference && biographyBlock.biographicalReferences.length > 0) {
        warnings.push({
          code: "NO_PRIMARY_REFERENCES",
          message: "No tier: 'primary' biographical references found",
          path: "content[0].biographicalReferences"
        });
      }
    }

    results.push({
      narratorId: node.id,
      narratorName: node.title.en || "",
      errors,
      warnings
    });
  }

  return results;
}

export function generateValidationReport(results: BiographyValidationResult[]): string {
  let report = "## Biographical References Validation Report\n\n";

  const totalNarrators = results.length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const narratorsWithNoRefs = results.filter(r =>
    r.errors.some(e => e.code === "NO_BIOGRAPHICAL_REFERENCES")
  ).length;
  const narratorsWithErrors = results.filter(r =>
    r.errors.length > 0
  ).length;

  report += `### Summary\n\n`;
  report += `- Total published narrators: ${totalNarrators}\n`;
  report += `- Total narrative biography references: ${totalErrors}\n`;
  report += `- Narrators with no references: ${narratorsWithNoRefs}\n`;
  report += `- Narrators requiring manual review: ${narratorsWithErrors}\n`;
  report += `- Validation warnings: ${totalWarnings}\n\n`;

  // Group errors by type
  const errorGroups: Record<ValidationErrorCode, BiographyValidationResult[]> = {} as Record<ValidationErrorCode, BiographyValidationResult[]>;
  for (const result of results) {
    for (const error of result.errors) {
      if (!errorGroups[error.code]) {
        errorGroups[error.code] = [];
      }
      errorGroups[error.code].push(result);
    }
  }

  // Report each error type
  report += `### Detailed Results\n\n`;

  if (errorGroups["NO_BIOGRAPHICAL_REFERENCES"]) {
    report += `#### Error: NO_BIOGRAPHICAL_REFERENCES (${errorGroups["NO_BIOGRAPHICAL_REFERENCES"].length})\n\n`;
    for (const result of errorGroups["NO_BIOGRAPHICAL_REFERENCES"]) {
      report += `- **${result.narratorName}** (${result.narratorId})\n`;
    }
    report += `\n`;
  }

  if (errorGroups["INVALID_PROVENANCE"]) {
    report += `#### Error: INVALID_PROVENANCE (${errorGroups["INVALID_PROVENANCE"].length})\n\n`;
    for (const result of errorGroups["INVALID_PROVENANCE"]) {
      report += `- **${result.narratorName}** (${result.narratorId})\n`;
    }
    report += `\n`;
  }

  if (errorGroups["DUPLICATE_WORK_TITLE"]) {
    report += `#### Error: DUPLICATE_WORK_TITLE (${errorGroups["DUPLICATE_WORK_TITLE"].length})\n\n`;
    for (const result of errorGroups["DUPLICATE_WORK_TITLE"]) {
      report += `- **${result.narratorName}** (${result.narratorId})\n`;
    }
    report += `\n`;
  }

  return report;
}