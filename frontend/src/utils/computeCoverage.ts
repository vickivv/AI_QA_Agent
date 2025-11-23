export function computeFunctionCoverage(
  sourceFunctions: string[],
  testCode: string
) {
  const tested = new Set<string>();

  for (const fn of sourceFunctions) {
    // look for function name followed by (
    const pattern = new RegExp(`\\b${fn}\\s*\\(`);
    if (pattern.test(testCode)) {
      tested.add(fn);
    }
  }

  const total = sourceFunctions.length;
  const covered = tested.size;
  const percent = total === 0 ? 0 : Math.round((covered / total) * 100);

  return {
    percent,
    covered,
    total,
    testedFunctions: [...tested],
    missingFunctions: sourceFunctions.filter((fn) => !tested.has(fn)),
  };
}
