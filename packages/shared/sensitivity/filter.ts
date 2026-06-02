/**
 * Person-first sensitivity scanner.
 *
 * Lifted from psychage-v2 src/lib/article-framework/quality-gate.ts:268 at
 * SHA 528a8d5. Lowercase contains-scan that flags each occurrence of a
 * SENSITIVITY_TERMS entry, capturing 20 chars of context on either side.
 *
 * Non-blocking: returns flags with suggested replacements; callers decide
 * whether to warn, block, or rewrite. PEAF quality gate marks the check
 * status as 'warning' (never 'fail').
 */

import { SENSITIVITY_TERMS } from "./terms";

export interface SensitivityFlag {
  term: string;
  suggestion: string;
  position: number;
  context: string;
}

export function scanForSensitivity(content: string): SensitivityFlag[] {
  const flags: SensitivityFlag[] = [];
  const lowerContent = content.toLowerCase();

  for (const { term, suggestion } of SENSITIVITY_TERMS) {
    const lowerTerm = term.toLowerCase();
    let pos = lowerContent.indexOf(lowerTerm);

    while (pos !== -1) {
      const start = Math.max(0, pos - 20);
      const end = Math.min(content.length, pos + term.length + 20);
      const context = content.slice(start, end);

      flags.push({ term, suggestion, position: pos, context });
      pos = lowerContent.indexOf(lowerTerm, pos + 1);
    }
  }

  return flags;
}
