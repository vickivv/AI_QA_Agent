export function colorizePytestOutput(output: string): string {
  if (!output) return "";

  let html = output;

  // Color: PASSED → green
  html = html.replace(/PASSED/g, `<span class="text-green-600 font-semibold">PASSED</span>`);
  // lowercase passed → green
  html = html.replace(/passed/g, `<span class="text-green-600 font-semibold">passed</span>`);

  // Color: FAILED / ERROR → red
  html = html.replace(/FAILED/g, `<span class="text-red-600 font-semibold">FAILED</span>`);
  html = html.replace(/ERROR/g, `<span class="text-red-600 font-semibold">ERROR</span>`);

  // Color: file paths → blue
  html = html.replace(
    /(tests\/[A-Za-z0-9_\/.:-]+)/g,
    `<span class="text-blue-600">$1</span>`
  );

  // Color: pytest header lines → gray
  html = html.replace(
    /^=+.*?=+$/gm,
    match => `<span class="text-gray-500">${match}</span>`
  );

  // Monospace alignment preserved
  html = html.replace(/\n/g, "<br/>");

  return html;
}
