// js/main.js
import { FILES, buildTree } from "./data.js";
import { Shell } from "./terminal.js";
import { renderFile } from "./viewer.js";

const state = {
  openTabs: [],
  activePath: null,
  filesByPath: new Map(FILES.map(f => [f.virtualPath, f]))
};

document.addEventListener("DOMContentLoaded", () => {
  const outputEl = document.getElementById("terminal-output");
  const inputEl  = document.getElementById("terminal-input");
  const promptEl = document.getElementById("terminal-prompt");
  const shell = new Shell({
    outputEl,
    inputEl,
    promptEl,
    data: {
      owner: "Josiah",
      prompt: "josiah@site:~$",
      about: "A CS student working on ML & Systems. This world is worth developing for!",
      links: { github: "https://github.com/josiahwayne" },
      blog: [],
      projects: []
    }
  });
  shell.init();

  const tree = buildTree(FILES);
  const treeEl = document.getElementById("file-tree");
  buildTreeDom(tree, treeEl);

  const defaultFile = state.filesByPath.get("README.md");
  if (defaultFile) {
    openTab(defaultFile);
  }

  redrawTabs();
  redrawPreview();
});

function buildTreeDom(node, parentEl) {
  const entries = Object.keys(node).sort((a, b) => a.localeCompare(b));
  for (const key of entries) {
    const value = node[key];
    const li = document.createElement("li");
    li.className = "sidebar-item";

    if (value.__file) {
      li.classList.add("file");
      li.textContent = key;
      li.addEventListener("click", () => openTab(value.__file));
      parentEl.appendChild(li);
    } else {
      li.classList.add("folder");
      li.textContent = key + "/";
      parentEl.appendChild(li);

      const ul = document.createElement("ul");
      ul.className = "sidebar-list";
      parentEl.appendChild(ul);
      buildTreeDom(value, ul);
    }
  }
}

function openTab(file) {
  const exists = state.openTabs.find(t => t.virtualPath === file.virtualPath);
  if (!exists) {
    state.openTabs.push(file);
  }
  state.activePath = file.virtualPath;
  redrawTabs();
  redrawPreview();
}

function closeTab(virtualPath) {
  const idx = state.openTabs.findIndex(t => t.virtualPath === virtualPath);
  if (idx >= 0) {
    state.openTabs.splice(idx, 1);
  }
  if (state.activePath === virtualPath) {
    const next = state.openTabs[idx] || state.openTabs[idx - 1] || null;
    state.activePath = next ? next.virtualPath : null;
  }
  redrawTabs();
  redrawPreview();
}

function activateTab(virtualPath) {
  state.activePath = virtualPath;
  redrawTabs();
  redrawPreview();
}

function redrawTabs() {
  const bar = document.getElementById("editor-tabbar");
  bar.innerHTML = "";
  for (const t of state.openTabs) {
    const div = document.createElement("div");
    div.className = "tab" + (t.virtualPath === state.activePath ? " active" : "");
    div.title = t.virtualPath;
    div.addEventListener("click", () => activateTab(t.virtualPath));

    const label = document.createElement("span");
    label.textContent = t.virtualPath.split("/").slice(-1)[0];

    const close = document.createElement("span");
    close.className = "close";
    close.textContent = "×";
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(t.virtualPath);
    });

    div.appendChild(label);
    div.appendChild(close);
    bar.appendChild(div);
  }
}

function redrawPreview() {
  const container = document.getElementById("editor-content");
  const file = state.filesByPath.get(state.activePath || "");
  renderFile({ file, container });
}
