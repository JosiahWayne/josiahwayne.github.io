// js/main.js
import { loadFiles, buildTree } from "./data.js";
import { Shell } from "./terminal.js";
import { renderFile } from "./viewer.js";

const state = {
  openTabs: [],
  activePath: null,
  filesByPath: new Map()
};

document.addEventListener("DOMContentLoaded", async () => {
  // 标题栏交互：初始展开，1秒后收起；鼠标靠近顶部时展开
  const titlebar = document.querySelector(".titlebar");
  const TITLEBAR_THRESHOLD = 8;
  let titlebarLocked = true;

  titlebar.classList.add("expanded");
  setTimeout(() => {
    titlebar.classList.remove("expanded");
    titlebarLocked = false;
  }, 1000);

  document.addEventListener("mousemove", (e) => {
    if (titlebarLocked) return;
    if (e.clientY < TITLEBAR_THRESHOLD) {
      titlebar.classList.add("expanded");
    } else {
      titlebar.classList.remove("expanded");
    }
  });

  // 鼠标离开页面时收起
  document.addEventListener("mouseleave", () => {
    if (!titlebarLocked) {
      titlebar.classList.add("expanded");
    }
  });

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

  // 异步加载文件列表
  const files = await loadFiles();
  state.filesByPath = new Map(files.map(f => [f.virtualPath, f]));

  const tree = buildTree(files);
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
  // 排序：文件夹在前，文件在后，各自按字母排序
  const entries = Object.keys(node).sort((a, b) => {
    const aIsFile = !!node[a].__file;
    const bIsFile = !!node[b].__file;
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
    return a.localeCompare(b);
  });

  for (const key of entries) {
    const value = node[key];
    const li = document.createElement("li");
    li.className = "sidebar-item";

    if (value.__file) {
      // 文件
      li.classList.add("file");
      li.textContent = key;
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        openTab(value.__file);
      });
      parentEl.appendChild(li);
    } else {
      // 文件夹
      li.classList.add("folder");
      li.classList.add("expanded"); // 默认展开

      const arrow = document.createElement("span");
      arrow.className = "folder-arrow";

      const name = document.createElement("span");
      name.className = "folder-name";
      name.textContent = key;

      li.appendChild(arrow);
      li.appendChild(name);
      parentEl.appendChild(li);

      const ul = document.createElement("ul");
      ul.className = "sidebar-list folder-children";
      parentEl.appendChild(ul);
      buildTreeDom(value, ul);

      // 点击文件夹切换展开/折叠
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        li.classList.toggle("expanded");
        ul.classList.toggle("collapsed");
      });
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
