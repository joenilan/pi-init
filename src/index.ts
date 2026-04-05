/**
 * pi-init — /init slash command
 *
 * Generates or updates an AGENTS.md in the current working directory.
 *
 * Usage:
 *   /init              Explore-first project analysis → AGENTS.md
 *   /init code         Same as bare /init
 *   /init research     Research protocol with incremental findings tracking
 *   /init debug        Debug protocol — carries forward Research Findings from prior /init research
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATE_CODE = `# Project Agent

**Workspace Path:** \`{{CWD}}\`
*(Note to Pi: Your file write/edit tools run in a different directory by default. You MUST use absolute paths starting with the Workspace Path above for ALL file operations!)*

<!-- Pi: before writing anything, explore this project:
  1. Read package.json / pyproject.toml / Cargo.toml / go.mod — identify stack and versions
  2. Scan directory structure: rg --files | head -60
  3. Read 3-5 key source files to understand patterns and conventions
  4. Check for .cursorrules, CLAUDE.md, .eslintrc, prettier.config — existing AI/style config
  Then fill in each section below based on what you actually find.
  Adapt or add sections if the project has unique needs.
-->

**Generated:** <!-- Pi: insert today's date (YYYY-MM-DD) -->

## Stack
<!-- Pi: languages, frameworks, key libraries and their versions -->

## Structure
<!-- Pi: key directories and what each contains — a mental map, not a full file list -->

## Commands
| Action  | Command |
|---------|---------|
| Install |         |
| Build   |         |
| Test    |         |
| Run     |         |

## Conventions
<!-- Pi: coding style, patterns in use, formatter/linter config, naming conventions -->

## Key Files
<!-- Pi: the 5-10 most important files and what each one does -->

## What to Avoid
<!-- Pi: patterns or changes that would break things or go against project style -->

## Notes
<!-- Pi: existing AI config files (.cursorrules, CLAUDE.md), gotchas, constraints, anything a new agent must know -->
`;

const TEMPLATE_RESEARCH = `# Research Agent

**Workspace Path:** \`{{CWD}}\`
*(Note to Pi: Your file write/edit tools run in a different directory by default. You MUST use absolute paths starting with the Workspace Path above for ALL file operations!)*

**Started:** <!-- Pi: insert today's date (YYYY-MM-DD) -->

## Output Rule — Files Before Chat
**Never summarize findings in chat.** Every finding goes into a file.
- Create \`{{CWD}}/research/<topic>.md\` as you complete each topic — not at the end
- Update the Research Findings section in this file after writing each doc
- Chat response comes last, only to say what files were written and what to do next
- **If you are about to type a finding into chat — stop. Write it to a file instead.**
- The goal is a handoff document set for the next agent, not a conversation

## Search Protocol
- Run at least **4 distinct queries** approaching the topic from different angles before drawing conclusions
- Read the **full content** of at least 6 sources — not just summaries or snippets
- For JS-heavy or dynamically rendered pages where \`fetch\` returns sparse HTML, use **Playwright** to render and extract
- Cross-reference findings across sources before responding

## Source Quality Standards
- Prefer primary sources: official documentation, research papers, original announcements
- Flag secondary sources: forums, blog posts, aggregators — note them as such
- When sources conflict, surface the contradiction explicitly — do not silently pick one
- Cite every factual claim with its source URL

## Research Process
1. **Map** — 3-4 broad queries to understand the landscape and identify the key sources
2. **Dive** — read the full content of the 5-6 most relevant sources
3. **Cross-reference** — identify what sources agree and disagree on
4. **Synthesize** — build a coherent picture with citations
5. **Write** — save to \`{{CWD}}/research/<topic>.md\` with full detail, citations, code snippets, and gaps
6. **Update AGENTS.md** — add the file to Research Findings below, one line per file
7. Repeat steps 1-6 for each sub-topic before moving on

## research/<topic>.md format
Each file should contain:
- **What was found** — detailed findings with citations (URLs)
- **Key facts** — bullet list of the most important discoveries
- **Conflicts** — where sources disagreed and which is more credible
- **Code / config** — any relevant snippets, commands, or configuration found
- **Gaps** — what could not be found or verified
- **Next steps** — what a follow-up agent should investigate or try

## Tools
- \`searxng\` — start here for all searches (private, no tracking)
- \`fetch\` — static pages, documentation, GitHub READMEs
- \`playwright\` — JS-rendered pages, React/Vue apps, login-gated content, anything fetch returns blank for
- \`sequential-thinking\` — use when the research has multiple dependent steps or requires structured reasoning
- \`memory\` — persist key findings across a long session so nothing gets lost to context limits
- \`pi-docparser\` — for PDFs, papers, Word docs, spreadsheets

## Research Findings
<!-- Pi: after writing each {{CWD}}/research/<topic>.md, add a line here immediately:
     - [Topic title](research/filename.md) — one-line summary of what was found
     Do not wait until the end. Update this section after every file written. -->
`;

const TEMPLATE_DEBUG = `# Debug Agent

**Workspace Path:** \`{{CWD}}\`
*(Note to Pi: Your file write/edit tools run in a different directory by default. You MUST use absolute paths starting with the Workspace Path above for ALL file operations!)*

## Research Findings
<!-- Pi: read every file linked here before starting investigation — prior research is your context -->

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
1. Read all Research Findings files linked above — prior research changes what you look for
2. Read all available logs — error, build, runtime, access
3. Trace the startup / execution sequence from the entry point
4. Check dependency versions and compatibility
5. Verify environment variables and configuration files
6. Isolate the **earliest** point of failure — fixes belong there, not downstream

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

// Prepended to existing AGENTS.md when /init code is run on a project that already has one
const UPDATE_BANNER = `<!-- Pi: UPDATE MODE
This AGENTS.md was generated in a prior session. Your job:
1. Re-explore the project (rg --files, re-read key source files)
2. Check for new or changed .cursorrules, CLAUDE.md, or other AI config files
3. Update every section below with fresh findings — fix stale info, fill gaps
4. Preserve any human-authored notes that don't conflict with current reality
-->

`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type InitType = "code" | "research" | "debug";

function parseType(args: string): InitType {
  const t = (args || "").trim().toLowerCase();
  if (t === "research") return "research";
  if (t === "debug") return "debug";
  return "code";
}

function getFollowUp(type: InitType): string {
  switch (type) {
    case "research":
      return "AGENTS.md written with the research protocol. Describe what you want to research — Pi will search, read sources, save findings to research/ files, and update the Research Findings section as it goes.";
    case "debug":
      return "AGENTS.md written with the debug protocol. Ask Pi to read this directory and fill in the Current State section before starting any investigation.";
    default:
      return "AGENTS.md written. Ask Pi to explore this project and fill in all sections — it will read the codebase first, then generate.";
  }
}

/**
 * Returns true if the file has meaningful filled-in content beyond placeholders.
 */
function hasFilledContent(content: string): boolean {
  const withoutComments = content.replace(/<!--[\s\S]*?-->/g, "").trim();
  const withoutHeaders = withoutComments.replace(/^#+.*$/gm, "").replace(/^\*\*Generated:?\*\*.*$/gm, "").trim();
  return withoutHeaders.length > 80;
}

/**
 * Extracts the body of the ## Research Findings section from an existing AGENTS.md.
 * Returns empty string if section is missing or contains only the placeholder comment.
 */
function extractResearchFindings(content: string): string {
  const m = content.match(/^## Research Findings\n([\s\S]*?)(?=\n## |\n# |$)/m);
  if (!m) return "";
  const body = m[1].trim();
  if (body.startsWith("<!--") && body.endsWith("-->")) return "";
  return body;
}

/**
 * Injects research findings into the debug template, replacing the placeholder comment.
 */
function buildDebugWithFindings(findings: string): string {
  return TEMPLATE_DEBUG.replace(
    "<!-- Pi: read every file linked here before starting investigation — prior research is your context -->",
    findings
  );
}

// ─── Extension entry ──────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.registerCommand("init", {
    description: "Generate or update an AGENTS.md for this project. Usage: /init [code|research|debug]",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const type = parseType(args);
      const cwd: string = ctx.cwd ?? process.cwd();
      const dest = path.join(cwd, "AGENTS.md");
      const exists = fs.existsSync(dest);

      // ── Debug: carry forward Research Findings from a prior research session ──
      if (type === "debug" && exists) {
        const existing = fs.readFileSync(dest, "utf8");
        const findings = extractResearchFindings(existing);
        if (findings) {
          fs.writeFileSync(dest, buildDebugWithFindings(findings), "utf8");
          ctx.ui.notify(`[pi-init] AGENTS.md switched to debug protocol — research findings carried forward`, "info");
          ctx.ui.notify(getFollowUp("debug"), "info");
          return;
        }
      }

      // ── Code: update mode if AGENTS.md has real content (no overwrite prompt) ──
      if (type === "code" && exists) {
        const existing = fs.readFileSync(dest, "utf8");
        if (hasFilledContent(existing)) {
          fs.writeFileSync(dest, UPDATE_BANNER + existing, "utf8");
          ctx.ui.notify(`[pi-init] AGENTS.md flagged for update — ask Pi to re-explore and refresh all sections`, "info");
          return;
        }
      }

      // ── All other cases: confirm overwrite if file exists ──
      if (exists) {
        const overwrite = await ctx.ui.confirm(
          `AGENTS.md already exists in:\n${cwd}`,
          "Overwrite it?"
        );
        if (!overwrite) {
          ctx.ui.notify("Cancelled — existing AGENTS.md kept.", "info");
          return;
        }
      }

      let content = type === "research" ? TEMPLATE_RESEARCH
                    : type === "debug"    ? TEMPLATE_DEBUG
                    :                       TEMPLATE_CODE;

      // Ensure paths are absolute and formatted correctly for the LLM
      const absoluteCwd = cwd.replace(/\\/g, "/");
      content = content.replace(/\{\{CWD\}\}/g, absoluteCwd);

      fs.writeFileSync(dest, content, "utf8");

      // ── Research: scaffold research/ dir and plan.md so Pi fills in existing files ──
      if (type === "research") {
        const researchDir = path.join(cwd, "research");
        if (!fs.existsSync(researchDir)) fs.mkdirSync(researchDir);
        const planPath = path.join(researchDir, "plan.md");
        if (!fs.existsSync(planPath)) {
          fs.writeFileSync(planPath, `# Research Plan\n\n## Topic\n<!-- What are we researching? -->\n\n## Sub-topics to investigate\n<!-- Pi: list each angle you will cover, one per line. Write a <topic>.md file for each. -->\n\n## Key questions to answer\n<!-- Pi: what specific questions must be answered by the end of this session? -->\n\n## Known starting points\n<!-- Pi: any URLs, files, or repos already identified as relevant -->\n`, "utf8");
        }
        ctx.ui.notify(`[pi-init] research/plan.md created — Pi will fill this in before searching`, "info");
      }

      ctx.ui.notify(`[pi-init] AGENTS.md (${type}) written to ${cwd}`, "info");
      ctx.ui.notify(getFollowUp(type), "info");
    },
  });
}
