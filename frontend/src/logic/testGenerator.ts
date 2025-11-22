// src/logic/testGenerator.ts

import { getTestFilePath } from "../utils/fileUtils";

/**
 * Inserts generated test code into the correct test file.
 */
export function applyGeneratedTest(
  selectedFile: string,
  generatedCode: string,
  fileContents: Record<string, string>
) {
  const testFile = getTestFilePath(selectedFile);

  return {
    updatedContents: {
      ...fileContents,
      [testFile]: generatedCode,   // create or overwrite
    },
    testFile,
  };
}
