// js/data.js

export async function loadFiles(path = "content/files.json") {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export function inferTypeFromPath(path) {
  if (!path) return "text";
  const lower = path.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".tex")) return "latex";
  if (
    lower.endsWith(".py") ||
    lower.endsWith(".js") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".c") ||
    lower.endsWith(".cpp") ||
    lower.endsWith(".h") ||
    lower.endsWith(".json")
  ) return "code";
  return "text";
}

export function buildTree(files) {
  const tree = {};
  for (const f of files) {
    const parts = f.virtualPath.split("/");
    let cur = tree;
    for (let i = 0; i < parts.length; i++) {
      const isFile = i === parts.length - 1;
      const key = parts[i];
      if (!cur[key]) {
        if (isFile) {
          cur[key] = { __file: f };
        } else {
          cur[key] = {};
        }
      }
      cur = cur[key];
    }
  }
  return tree;
}
