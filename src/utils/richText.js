export function renderRichText(text) {
  const safe = String(text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const withBold = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*(.+?)\*/g, "<em>$1</em>");
  const withHeadings = withItalic
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");
  const withLinks = withHeadings.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  const lines = withLinks.split("\n");
  let html = "";
  let inList = false;
  for (const line of lines) {
    const listMatch = /^- (.+)$/.exec(line);
    if (listMatch) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${listMatch[1]}</li>`;
      continue;
    }
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (line.trim() === "") {
      html += "<br />";
    } else if (/^<h\d>/.test(line)) {
      html += line;
    } else {
      html += `<p>${line}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}
