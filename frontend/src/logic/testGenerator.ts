// src/logic/testGenerator.ts
import { extractFunctionNames } from "../utils/extractFunctions";
import { computeFunctionCoverage } from "../utils/computeCoverage";

export function applyGeneratedTest(
  selectedFile: string,
  generatedCode: string,
  fileContents: Record<string, string>
) {
  // generate test file path and name
  const fileName = selectedFile.split("/").pop() || "main.py";
  const testFileName = "test_" + fileName;
  const testFilePath = `tests/${testFileName}`;

  // prepare updated file contents
  const updatedContents = {
    ...fileContents,
    [testFilePath]: generatedCode,
  };

  // get source code function names
  const sourceCode = fileContents[selectedFile] || "";
  const functionNames = extractFunctionNames(sourceCode);

  // calculate coverage
  const coverage = computeFunctionCoverage(functionNames, generatedCode);

  return {
    updatedContents,
    testFile: testFilePath,
    coverage, 
  };
}

