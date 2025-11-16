// --- 可调参数 ---
const MIN_SIDEBAR = 140;          // px
const MAX_SIDEBAR_VW = 60;        // 占视口宽度上限 %
const MIN_TERMINAL = 120;         // px
const MAX_TERMINAL_VH = 70;       // 占视口高度上限 %

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// 读取/应用持久化尺寸
(function applyPersistedSizes() {
  const sw = localStorage.getItem("sidebarWidth");
  const th = localStorage.getItem("terminalHeight");
  if (sw) document.documentElement.style.setProperty("--sidebar-width", `${parseInt(sw, 10)}px`);
  if (th) document.documentElement.style.setProperty("--terminal-height", `${parseInt(th, 10)}px`);
})();

function initResizers() {
  const v = document.querySelector('[data-role="sidebar-resizer"]');
  const h = document.querySelector('[data-role="terminal-resizer"]');
  if (v) setupVertical(v);
  if (h) setupHorizontal(h);
}

function setupVertical(handle) {
  let startX, startW;

  const onDown = (e) => {
    e.preventDefault();
    handle.classList.add("dragging");
    startX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const sidebar = document.querySelector(".sidebar");
    startW = sidebar.getBoundingClientRect().width;
    handle.setPointerCapture?.(e.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const onMove = (e) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    if (clientX == null) return;
    const dx = clientX - startX;
    const vwMax = window.innerWidth * (MAX_SIDEBAR_VW / 100);
    const newW = clamp(startW + dx, MIN_SIDEBAR, vwMax);
    document.documentElement.style.setProperty("--sidebar-width", `${Math.round(newW)}px`);
  };

  const onUp = () => {
    handle.classList.remove("dragging");
    window.removeEventListener("pointermove", onMove);
    const cur = getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width");
    localStorage.setItem("sidebarWidth", parseInt(cur, 10));
  };

  handle.addEventListener("pointerdown", onDown);
}

function setupHorizontal(handle) {
  let startY, startH;

  const onDown = (e) => {
    e.preventDefault();
    handle.classList.add("dragging");
    startY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const term = document.querySelector(".terminal");
    startH = term.getBoundingClientRect().height;
    handle.setPointerCapture?.(e.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const onMove = (e) => {
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    if (clientY == null) return;
    const dy = startY - clientY; // 向上拖动增大终端
    const vhMax = window.innerHeight * (MAX_TERMINAL_VH / 100);
    const newH = clamp(startH + dy, MIN_TERMINAL, vhMax);
    document.documentElement.style.setProperty("--terminal-height", `${Math.round(newH)}px`);
  };

  const onUp = () => {
    handle.classList.remove("dragging");
    window.removeEventListener("pointermove", onMove);
    const cur = getComputedStyle(document.documentElement).getPropertyValue("--terminal-height");
    localStorage.setItem("terminalHeight", parseInt(cur, 10));
  };

  handle.addEventListener("pointerdown", onDown);
}

// DOM 就绪后初始化
document.addEventListener("DOMContentLoaded", initResizers);
