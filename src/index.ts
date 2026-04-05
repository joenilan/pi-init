/**
 * pi-init — /init slash command
 *
 * Generates a typed AGENTS.md in the current working directory.
 *
 * Usage:
 *   /init              Full project read → general AGENTS.md (architecture, build, conventions)
 *   /init code         Same as bare /init — implementation focus
 *   /init research     Research protocol (source depth, citation, tool usage)
 *   /init debug        Investigative protocol + prompts Pi to document the broken state
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATE_CODE = `# Project Agent

## Architecture
<!-- Pi: read this directory and describe the overall structure, main entry points, and how the pieces connect -->

## Build & Run
\`\`\`
# Pi: fill in the actual commands after reading package.json / Makefile / pyproject.toml / etc.
build:
test:
run:
\`\`\`

## Conventions
<!-- Pi: describe the coding style, patterns already in use, naming conventions, and what to follow -->

## Key Files
<!-- Pi: list the most important files and what each one does -->

## What to Avoid
<!-- Pi: note any patterns, approaches, or changes that would break things or go against project style -->

## Notes
<!-- Pi: anything else a new agent should know before touching this codebase -->
`;

const TEMPLATE_RESEARCH = `# Research Agent

## Search Protocol
- Run at least **4 distinct queries** approaching the topic from different angles before drawing conclusions
- Read the **full content** of at least 6 sources — not just summaries or snippets
- For JS-heavy or dynamically rendered pages where \`fetch\` returns sparse HTML, use **Playwright** to render and extract
- Cross-reference findings across sources before responding
- Do **not** respond until you have read multiple sources and built a complete picture

## Source Quality Standards
- Prefer primary sources: official documentation, research papers, original announcements
- Flag secondary sources: forums, blog posts, aggregators — note them as such
- When sources conflict, surface the contradiction explicitly — do not silently pick one
- Cite every factual claim with its source URL

## Research Process
1. **Map** — 3-4 broad queries to understand the landscape and identify the key sources
2. **Dive** — read the full content of the 5-6 most relevant sources
3. **Cross-reference** — identify what sources agree and disagree on
4. **Synthesize** — build a complete, coherent picture with citations
5. **Gaps** — explicitly note what you could not find or verify

## Tools
- \`searxng\` — start here for all searches (private, no tracking)
- \`fetch\` — static pages, documentation, GitHub READMEs
- \`playwright\` — JS-rendered pages, React/Vue apps, login-gated content, anything fetch returns blank for
- \`sequential-thinking\` — use when the research has multiple dependent steps or requires structured reasoning
- \`memory\` — persist key findings across a long session so nothing gets lost to context limits
- \`pi-docparser\` — for PDFs, papers, Word docs, spreadsheets
`;

const TEMPLATE_DEBUG = `# Debug Agent

## Investigative Stance
- **Never assume** — verify everything against logs, actual code, and runtime behavior
- Read error messages and stack traces **in full** before proposing any fix
- Trace from the error **backward** to the root cause — not forward from a guess
- Document every finding, including dead ends — they matter for context

## Before Any Fix
- Checkpoint the current state with \`pi-rewind\` before touching anything
- Understand the full failure chain before writing a single line
- Identify whether the issue is: **configuration**, **code logic**, **dependencies**, **environment**, or **data**

## Investigation Order
1. Read all available logs — error, build, runtime, access
2. Trace the startup / execution sequence from the entry point
3. Check dependency versions and compatibility
4. Verify environment variables and configuration files
5. Isolate the **earliest** point of failure — fixes belong there, not downstream

## Current State
<!-- Pi: read this directory now and fill in:
- What is this project supposed to do?
- What is currently broken — exact error messages and symptoms
- Where does it fail — startup, build, runtime, specific operation?
- What has already been tried?
- Key files to investigate first
-->

## Constraints
- Use \`pi-rewind\` before every destructive or speculative change
- If you find multiple possible causes, list them ranked by likelihood before acting
- Confirm before deleting files, dropping data, or resetting state
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type InitType = "code" | "research" | "debug";

function parseType(args: string): InitType {
  const t = (args || "").trim().toLowerCase();
  if (t === "research") return "research";
  if (t === "debug") return "debug";
  return "code";
}

function getTemplate(type: InitType): string {
  switch (type) {
    case "research": return TEMPLATE_RESEARCH;
    case "debug":    return TEMPLATE_DEBUG;
    default:         return TEMPLATE_CODE;
  }
}

function getFollowUp(type: InitType): string {
  switch (type) {
    case "research":
      return "AGENTS.md written with the research protocol. You're ready — just describe what you want to research and Pi will follow the protocol automatically.";
    case "debug":
      return "AGENTS.md written with the debug protocol. Now ask Pi to read this directory and fill in the Current State section — it will map the broken state before starting any investigation.";
    default:
      return "AGENTS.md written. Now ask Pi to read this project and fill in the architecture, build commands, conventions, and key files sections.";
  }
}

// ─── Extension entry ──────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.registerCommand("init", {
    description: "Generate an AGENTS.md for this project. Usage: /init [code|research|debug]",
    handler: async (args: string, ctx: any) => {
      const type = parseType(args);
      const cwd: string = ctx.cwd ?? process.cwd();
      const dest = path.join(cwd, "AGENTS.md");

      // Warn if AGENTS.md already exists
      if (fs.existsSync(dest)) {
        const overwrite = await ctx.ui.confirm(
          `AGENTS.md already exists in:\n${cwd}`,
          "Overwrite it?"
        );
        if (!overwrite) {
          ctx.ui.notify("Cancelled — existing AGENTS.md kept.", "info");
          return;
        }
      }

      const content = getTemplate(type);
      fs.writeFileSync(dest, content, "utf8");

      const typeLabel = type === "code" ? "code" : type;
      ctx.ui.notify(
        `[pi-init] AGENTS.md (${typeLabel}) written to ${cwd}`,
        "info"
      );

      // Surface the follow-up instruction as a visible message
      ctx.ui.notify(getFollowUp(type), "info");
    },
  });
}
