import { extractFunctionNames } from "../utils/extractFunctions";
import { computeGlobalCoverage } from "../utils/computeCoverage";

export function applyGeneratedTest(
  sourcePath: string,
  rawTest: string,
  fileContents: Record<string, string>
) {
  const testFileName = "test_" + sourcePath.split("/").pop()!;
  const testFilePath = `tests/${testFileName}`;

  const modulePath = sourcePath.replace(".py", "").replace(/\//g, ".");
  const finalTestCode = `from ${modulePath} import *\n\n${rawTest}`;

  const updatedContents = {
    ...fileContents,
    [testFilePath]: finalTestCode,
  };

  // Compute GLOBAL coverage
  let allFunctions: string[] = [];

  for (const [path, content] of Object.entries(updatedContents)) {
    if (!path.startsWith("tests/") && path.endsWith(".py")) {
      const fns = extractFunctionNames(content);
      allFunctions = [...allFunctions, ...fns];
    }
  }

  const coverage = computeGlobalCoverage(allFunctions, updatedContents);

  return {
    updatedContents,
    testFile: testFilePath,
    coverage, // { percent, covered, ... }
  };
}
