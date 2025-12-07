export function downloadFile(path: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = path.split("/").pop()!;
  link.click();

  URL.revokeObjectURL(url);
}
