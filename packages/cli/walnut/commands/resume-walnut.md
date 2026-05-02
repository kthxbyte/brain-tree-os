---
name: resume-walnut
description: Resume work on a Walnut brain — loads context and recommends next steps
agent: build
---

**You are now executing the resume-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Resume Brain Session

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty.
- If empty: read `~/.braintree-os/brains.json`. If no brains, tell the user: "No brain found. Run /walnut:init-walnut to create one." Stop. If one brain, use its path. If multiple, list them numbered and ask the user to pick.
- If `FOUND:<path>`: extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Load context
Run: `brain-tree-os resume-context <brain-root>`
The command returns JSON with: brain_name, latest_handoff (path + full content), in_progress_steps, folders.

Also read `<brain-root>/CLAUDE.md` — this contains the brain's purpose, conventions, and special rules. Keep this in mind for the entire session.

## Step 2: Present status
Present this structure:

**Last Session Recap** — 2-3 sentences on what was accomplished. Call out any blockers or open questions left from the previous session.

**Current Progress** — ASCII progress bar per phase, built from the execution plan step counts:
```
Phase 1: Name     [====------] 40%  (4/10 steps)
```

**Recommended Next Steps** — Name the highest-priority in_progress step and explain why it matters. List up to 3 steps. Note any that can run in parallel.

## Step 3: Ask what to work on
Present in_progress_steps as a numbered list, plus "Something else."
Wait for the user to choose, then start working immediately.
