// src/utils/fileUtils.ts

/** Extracts basename from a path e.g. 'src/foo/bar.py' → 'bar.py' */
export function getBaseName(path: string): string {
  return path.split("/").pop()!;
}

/** Returns test file path e.g. src/main.py → tests/test_main.py */
export function getTestFilePath(srcPath: string): string {
  const base = getBaseName(srcPath).replace(".py", "");
  return `tests/test_${base}.py`;
}
