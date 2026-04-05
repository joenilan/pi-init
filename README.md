# pi-init

Adds `/init` to [Pi](https://pi.dev/) — generates or updates an AGENTS.md in your current project directory.

## Install

```bash
# via npm (recommended)
pi install npm:@dreadedzombie/pi-init

# via GitHub
pi install https://github.com/joenilan/pi-init
```

Pi loads the extension automatically on next start.

## Usage

```
/init              Explore-first project analysis → AGENTS.md
/init code         Same as bare /init
/init research     Research protocol with incremental findings tracking
/init debug        Debug protocol — carries forward research findings automatically
```

## What each type does

**`/init` / `/init code`** — Pi explores the project first (reads package.json, scans
structure, reads key source files, checks for `.cursorrules`/`CLAUDE.md`), then writes
a filled-in AGENTS.md. If AGENTS.md already has content, running `/init` again flags it
for update — Pi re-explores and refreshes stale sections without wiping human-authored notes.

**`/init research`** — Writes a research protocol: minimum source count, citation
requirements, when to use Playwright vs fetch, sequential-thinking for multi-step
reasoning, memory for long sessions. Includes a `## Research Findings` section Pi
updates incrementally — each topic gets saved to `research/<topic>.md` and linked here.

**`/init debug`** — Writes an investigative protocol: verify before assuming, read logs
first, checkpoint with `pi-rewind` before changes, trace backward from the error. If
you ran `/init research` first, the Research Findings section carries forward
automatically — Pi reads those files at step 1 before touching any code.

## Research → Debug workflow

```
/init research        # set up research protocol
# describe your topic — Pi searches, reads sources, saves to research/*.md

/init debug           # switch to debug — research findings carry forward automatically
# Pi reads linked research files before starting any investigation
```

Colony agents read AGENTS.md from the working directory on every action, so they see
research findings and debug context the same way a single-agent session does.
