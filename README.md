# pi-init

Adds `/init` to Pi — generates a typed AGENTS.md in your current project directory.

## Usage

```
/init              General project (architecture, build, conventions)
/init code         Same as bare /init
/init research     Research protocol (source depth, citation, tool usage, Playwright)
/init debug        Investigative protocol + prompts Pi to map the broken state
```

## What each type does

**`/init` / `/init code`** — Writes a template with sections for architecture, build/run
commands, conventions, key files, and what to avoid. Pi fills these in by reading the
project after you ask it to.

**`/init research`** — Writes a research protocol: minimum source count, citation
requirements, when to use Playwright vs fetch, sequential-thinking usage, memory
for long sessions. Use this in a research working directory before starting any
investigation.

**`/init debug`** — Writes an investigative protocol: verify before assuming, read logs
first, checkpoint before changes, trace backward from the error. Prompts Pi to read
the current broken state and document it in the file.

## Install

```
pi install E:\AI\Pi\agent\extensions\pi-init
```
