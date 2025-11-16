// js/terminal.js

export class Shell {
  constructor({ outputEl, inputEl, promptEl, data }) {
    this.outputEl = outputEl;
    this.inputEl = inputEl;
    this.promptEl = promptEl;
    this.data = data;

    this.history = [];
    this.historyIndex = -1;

    this.commands = {
      help: this.cmdHelp.bind(this),
      clear: this.cmdClear.bind(this),
      about: this.cmdAbout.bind(this),
      blog: this.cmdBlog.bind(this),
      post: this.cmdPost.bind(this),
      projects: this.cmdProjects.bind(this),
      search: this.cmdSearch.bind(this)
    };
  }

  init() {
    this.promptEl.textContent = this.data.prompt;
    this.printBanner();
    this.bindEvents();
    this.focusInput();
  }

  bindEvents() {
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const line = this.inputEl.value.trim();
        this.runCommand(line);
        this.inputEl.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.showHistory(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.showHistory(1);
      }
    });

    this.outputEl.addEventListener("click", () => this.focusInput());
    this.promptEl.addEventListener("click", () => this.focusInput());
  }

  focusInput() {
    this.inputEl.focus();
  }

  printBanner() {
    this.appendOutput(
      `VSCode-style terminal site for ${this.data.owner}\nType "help" to see available commands.\n`,
      "output-muted"
    );
  }

  showHistory(direction) {
    if (this.history.length === 0) return;
    if (this.historyIndex === -1) {
      this.historyIndex = this.history.length;
    }
    this.historyIndex += direction;
    if (this.historyIndex < 0) this.historyIndex = 0;
    if (this.historyIndex >= this.history.length) {
      this.historyIndex = this.history.length;
      this.inputEl.value = "";
      return;
    }
    this.inputEl.value = this.history[this.historyIndex];
    this.inputEl.setSelectionRange(this.inputEl.value.length, this.inputEl.value.length);
  }

  runCommand(line) {
    if (!line) {
      this.appendCommand(line);
      return;
    }

    this.history.push(line);
    this.historyIndex = -1;

    this.appendCommand(line);

    const [cmd, ...args] = line.split(/\s+/);
    const handler = this.commands[cmd];

    if (handler) {
      handler(args);
    } else {
      this.appendOutput(`command not found: ${cmd}`, "output-error");
    }
  }

  appendCommand(text) {
    const lineEl = document.createElement("div");
    lineEl.className = "terminal-line command";
    const promptSpan = document.createElement("span");
    promptSpan.textContent = this.data.prompt;
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    lineEl.appendChild(promptSpan);
    lineEl.appendChild(textSpan);
    this.outputEl.appendChild(lineEl);
    this.scrollToBottom();
  }

  appendOutput(text, extraClass = "output") {
    const lineEl = document.createElement("div");
    lineEl.className = `terminal-line ${extraClass}`;
    const span = document.createElement("span");
    span.textContent = text;
    lineEl.appendChild(span);
    this.outputEl.appendChild(lineEl);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  // ===== commands =====

  cmdHelp() {
    const msg = `
Available commands:
  help             Show this help message
  about            Show who I am
  blog             List blog posts
  post <id>        Show a specific blog post
  projects         List projects
  search <keyword> Search in titles and summaries
  clear            Clear the terminal
`.trim();
    this.appendOutput(msg);
  }

  cmdClear() {
    this.outputEl.innerHTML = "";
  }

  cmdAbout() {
    this.appendOutput(this.data.about);
    const links = this.data.links;
    if (links) {
      const linkStr = Object.entries(links)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      this.appendOutput(linkStr, "output-highlight");
    }
  }

  cmdBlog() {
    if (!this.data.blog || this.data.blog.length === 0) {
      this.appendOutput("No blog posts yet.");
      return;
    }
    const lines = this.data.blog.map(
      (post) => `- [${post.id}] ${post.title} (${post.date})`
    );
    this.appendOutput(lines.join("\n"));
    this.appendOutput('Use "post <id>" to view a post, e.g. post welcome', "output-muted");
  }

  cmdPost(args) {
    const id = args[0];
    if (!id) {
      this.appendOutput("Usage: post <id>", "output-error");
      return;
    }
    const post = this.data.blog.find((p) => p.id === id);
    if (!post) {
      this.appendOutput(`No post found with id "${id}".`, "output-error");
      return;
    }
    const header = `${post.title} (${post.date})`;
    this.appendOutput(header, "output-highlight");
    if (post.tags && post.tags.length > 0) {
      this.appendOutput("tags: " + post.tags.join(", "), "output-muted");
    }
    this.appendOutput(post.content);
  }

  cmdProjects() {
    if (!this.data.projects || this.data.projects.length === 0) {
      this.appendOutput("No projects recorded yet.");
      return;
    }
    const lines = this.data.projects.map(
      (p) => `- ${p.name}\n  ${p.description}\n  ${p.link}\n`
    );
    this.appendOutput(lines.join("\n"));
  }

  cmdSearch(args) {
    const keyword = args.join(" ").trim().toLowerCase();
    if (!keyword) {
      this.appendOutput("Usage: search <keyword>", "output-error");
      return;
    }
    const results = [];

    // search in blog posts (title + summary)
    for (const post of this.data.blog || []) {
      const haystack = `${post.title} ${post.summary}`.toLowerCase();
      if (haystack.includes(keyword)) {
        results.push(`blog: [${post.id}] ${post.title}`);
      }
    }

    // search in projects (name + description)
    for (const proj of this.data.projects || []) {
      const haystack = `${proj.name} ${proj.description}`.toLowerCase();
      if (haystack.includes(keyword)) {
        results.push(`project: ${proj.name}`);
      }
    }

    if (results.length === 0) {
      this.appendOutput(`No results for "${keyword}".`, "output-muted");
    } else {
      this.appendOutput(results.join("\n"));
      this.appendOutput(
        'Use "post <id>" or "projects" to see more details.',
        "output-muted"
      );
    }
  }
}
