---
name: wrap-up-walnut
description: End a Walnut brain session with a handoff note for the next session
agent: build
---

**You are now executing the wrap-up-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Wrap Up Session

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty. If empty, tell the user: "No brain found." Stop.
Extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Audit the session
Review your conversation history to identify:
- Files created or modified (in the brain or codebase)
- Execution plan steps that progressed or completed
- Decisions made and their rationale
- Blockers or open questions discovered
- Context the user shared that should be preserved

## Step 2: Update brain content
IMPORTANT: Use the edit tool to modify existing files and the write tool to create new ones. Do NOT use bash commands like vim, nano, cat, or touch.

For each brain folder touched during the session: read its index file, then update it with new content, status changes, and wikilinks to any new files created this session.
Rule: wikilinks ONLY to files that actually exist. Never link to files that haven't been created yet.

## Step 3: Update the execution plan
Read the execution plan file. Mark completed steps as `completed`. Mark started-but-unfinished steps as `in_progress`. Mark blocked steps as `blocked`.

## Step 4: Create the handoff
Run: `brain-tree-os next-handoff-number <brain-root>` — save the result as <NNN>
Run: `brain-tree-os now` — save the result as <timestamp>

Use the write tool to create `Handoffs/handoff-<NNN>.md` with these sections:
- First line: `> Part of [[Handoffs]]`
- `**Date**: <timestamp>`
- **Summary**: 2-3 sentences of what happened this session
- **What Was Done**: bullet list of files created/modified, features built, issues resolved
- **Decisions Made**: document decisions AND their rationale — future sessions need to know WHY
- **Blockers and Open Questions**: anything unresolved
- **Recommended Next Steps**: ordered by priority
- **Files to Read on Resume**: 3-5 wikilinks to the most important files for next session

## Step 5: Update index files
Edit `<brain-root>/BRAIN-INDEX.md`: add a session log entry with date and one-line summary.
Edit `<brain-root>/Handoffs/Handoffs.md`: add `[[handoff-<NNN>]]` to the Session History section.

Tell the user: "Session saved. Run /walnut:resume-walnut next time to pick up right where you left off."
