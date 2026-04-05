# pi-init

Adds `/init` to [Pi](https://pi.dev/) — generates a typed AGENTS.md in your current project directory.

## Install

```bash
pi install https://github.com/joenilan/pi-init
```

That's it. Pi clones the repo and loads the extension automatically on next start.

## Usage

```
/init              General project (architecture, build, conventions)
/init code         Same as bare /init
/init research     Research protocol with findings tracking
/init debug        Debug protocol — picks up research findings if you ran /init research first
```

## What each type does

**`/init` / `/init code`** — Writes a template with sections for architecture, build/run
commands, conventions, key files, and what to avoid. Pi fills these in by reading the
project after you ask it to.

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
# ask Pi to research your topic
# Pi saves findings to research/*.md and links them in AGENTS.md

/init debug           # switch to debug — research findings carry forward automatically
# Pi reads linked research files before starting any investigation
```

The colony also benefits — Pi colony agents read AGENTS.md from the working directory
on every action, so they see the research findings and debug context the same way.
