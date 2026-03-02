// js/viewer.js
import { inferTypeFromPath } from "./data.js";

const cache = new Map(); // path -> text content
let currentRequestId = 0; // 用于处理竞态条件

export function renderFile({ file, container }) {
  const requestId = ++currentRequestId;
  container.innerHTML = "";

  if (!file) {
    container.innerHTML = "<p class='output-muted'>No file selected.</p>";
    return;
  }
  const path = file.filePath;
  if (!path) {
    container.innerHTML = "<p class='output-error'>No filePath for this file.</p>";
    return;
  }
  container.innerHTML = "<p class='output-muted'>Loading...</p>";
  if (cache.has(path)) {
    const text = cache.get(path);
    renderText({ file, text, container });
    return;
  }

  fetch(path)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.text();
    })
    .then((text) => {
      cache.set(path, text);
      // 只有当这个请求仍然是最新的才渲染
      if (requestId === currentRequestId) {
        renderText({ file, text, container });
      }
    })
    .catch((err) => {
      console.error(err);
      // 只有当这个请求仍然是最新的才显示错误
      if (requestId === currentRequestId) {
        container.innerHTML = `<p class='output-error'>Failed to load file: ${path}</p>`;
      }
    });
}

function renderText({ file, text, container }) {
  const type = file.type || inferTypeFromPath(file.filePath);

  if (type === "markdown") {
    const html = marked.parse(text, {
      mangle: false,
      headerIds: true,
      breaks: true,
      highlight: (code, lang) => {
        if (!window.hljs) return code;
        try { return hljs.highlight(code, { language: lang }).value; }
        catch { return hljs.highlightAuto(code).value; }
      }
    });
    container.innerHTML = html;
    autoRenderMath(container);
    return;
  }

  if (type === "latex") {
    const pre = document.createElement("pre");
    pre.className = "katex-source";
    pre.textContent = text;
    container.appendChild(pre);
    const rendered = document.createElement("div");
    rendered.className = "latex-rendered";
    rendered.textContent = text;
    container.appendChild(rendered);
    autoRenderMath(rendered);
    return;
  }

  if (type === "text" || type === "code") {
    container.innerHTML = ""; // Clean up pre loading messages
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = text;
    pre.appendChild(code);
    container.appendChild(pre);
    if (window.hljs) {
      hljs.highlightElement(code);
    }
    return;
  }

  if (type === "pdf") {
    renderPDF(file.filePath, container);
    return;
  }

  container.innerHTML = "<p>Unsupported file type.</p>";
}

function autoRenderMath(el) {
  if (window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }
}

// ====== helper ======
function renderPDF(url, container) {
  container.innerHTML = ""; // 清空

  const iframe = document.createElement("iframe");
  iframe.className = "pdf-frame";
  iframe.src = `${url}#zoom=100&toolbar=0`; // 隐藏工具栏
  iframe.setAttribute("title", "PDF preview");
  iframe.setAttribute("loading", "lazy");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  let switched = false;
  const fallbackTimer = setTimeout(() => {
    if (switched) return;
    switched = true;
    renderWithPDFJS(url, container);
  }, 400);

  iframe.addEventListener("load", () => {
    if (switched) return;
    clearTimeout(fallbackTimer);
  });

  iframe.addEventListener("error", () => {
    if (switched) return;
    clearTimeout(fallbackTimer);
    switched = true;
    renderWithPDFJS(url, container);
  });

  container.appendChild(iframe);
}

function renderWithPDFJS(url, container) {
  container.innerHTML = "<p class='output-muted'>Rendering PDF…</p>";
  if (!window.pdfjsLib) {
    container.innerHTML = "<p class='output-error'>PDF.js not loaded.</p>";
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "pdf-viewer";
  container.innerHTML = "";
  container.appendChild(wrapper);

  pdfjsLib.getDocument(url).promise
    .then(async (pdf) => {
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = (container.clientWidth || 800) / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.className = "pdf-canvas";
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        wrapper.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    })
    .catch((err) => {
      console.error(err);
      container.innerHTML = "<p class='output-error'>Failed to render PDF.</p>";
    });
}
