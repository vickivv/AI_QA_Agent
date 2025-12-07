// utils/computeCoverage.ts

export function computeGlobalCoverage(
  allFunctions: string[],
  allTestFiles: Record<string, string>
) {
  const tested = new Set<string>();

  // Check each test file for function calls
  for (const [path, content] of Object.entries(allTestFiles)) {
    if (!path.startsWith("tests/")) continue; // only test files

    for (const fn of allFunctions) {
      const pattern = new RegExp(`\\b${fn}\\s*\\(`);
      if (pattern.test(content)) {
        tested.add(fn);
      }
    }
  }

  const covered = tested.size;
  const total = allFunctions.length;

  return {
    percent: total === 0 ? 0 : Math.round((covered / total) * 100),
    covered,
    total,
    testedFunctions: [...tested],
    missingFunctions: allFunctions.filter((f) => !tested.has(f)),
  };
}
