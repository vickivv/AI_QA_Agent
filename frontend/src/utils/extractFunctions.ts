export function extractFunctionNames(sourceCode: string): string[] {
  // match def function_name(
  const pattern = /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const names: string[] = [];
  let match;

  while ((match = pattern.exec(sourceCode)) !== null) {
    const fn = match[1];
    // ignore __init__
    if (fn !== "__init__") {
      names.push(fn);
    }
  }
  return names;
}
