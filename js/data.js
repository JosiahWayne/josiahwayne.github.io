// js/data.js

export const FILES = [
  {
    id: "readme",
    virtualPath: "README.md",
    filePath: "content/README.md",
    type: "markdown"
  },
  /*
  {
    id: "latex-derivation",
    virtualPath: "math/derivation.tex",
    filePath: "content/math/derivation.tex",
    type: "latex"
  },
  {
    id: "example-py",
    virtualPath: "src/example.py",
    filePath: "content/src/example.py",
    type: "code"
  },
  */
  {
    id: "Resume",
    virtualPath: "src/Resume.pdf",
    filePath: "content/CV_2025_Fall.pdf",
    type: "pdf"
  }
];

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

export function buildTree(files = FILES) {
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
