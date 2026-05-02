---
name: wrap-up-walnut
description: End a Walnut brain session with a handoff note for the next session
agent: build
---

# Wrap Up Session

## Brain Detection
Run: `brain-tree-os find-brain`
If no "FOUND:" in output, tell the user: "No brain found." Stop.

## Step 1: Get handoff number and timestamp
Run: `brain-tree-os next-handoff-number <brain-root>` — save the result as <NNN>
Run: `brain-tree-os now` — save the result as <timestamp>

## Step 2: Write the handoff
IMPORTANT: Use the write tool to create files and the edit tool to modify existing files. Do NOT use bash commands like vim, nano, cat, or touch.

Use the write tool to create `Handoffs/handoff-<NNN>.md` with these sections:
- First line: `> Part of [[Handoffs]]`
- `**Date**: <timestamp>`
- **Summary**: 2-3 sentences of what happened this session
- **What Was Done**: bullet list of files created/modified, decisions made, features built
- **Blockers and Open Questions**: anything unresolved
- **Recommended Next Steps**: ordered by priority
- **Files to Read on Resume**: 3-5 wikilinks to the most important files for next session

## Step 3: Update the brain
Edit BRAIN-INDEX.md: add a session log entry with date and one-line summary.
Edit Handoffs/Handoffs.md: add `[[handoff-<NNN>]]` to the Session History section.
Edit the execution plan: mark completed steps as `completed`, newly started steps as `in_progress`.

Tell the user: "Session saved. Run /walnut:resume-walnut next time to pick up right where you left off."
