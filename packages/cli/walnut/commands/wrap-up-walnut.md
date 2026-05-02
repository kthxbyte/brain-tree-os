---
name: wrap-up-walnut
description: End a Walnut brain session with a handoff note for the next session
agent: build
---

**You are now executing the wrap-up-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. You MUST complete ALL steps before responding to the user. Do not stop after any single step.**

# Wrap Up Session

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty. If empty, tell the user: "No brain found." Stop.
Extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Get handoff number and timestamp
Run: `brain-tree-os next-handoff-number <brain-root>` — save the result as <NNN>
Run: `brain-tree-os now` — save the result as <timestamp>

## Step 2: Audit the session
Review your conversation history and identify (keep this brief — 3-5 bullet points):
- Files created or modified
- Key decisions made and why
- Any blockers or unresolved questions

## Step 3: Write the handoff file
IMPORTANT: Use the write tool to create the file. Do NOT use bash commands like vim, nano, cat, or touch.

Use the write tool to create `<brain-root>/Handoffs/handoff-<NNN>.md` with these sections:
```
> Part of [[Handoffs]]
**Date**: <timestamp>

**Summary**: 2-3 sentences of what happened this session.

**What Was Done**:
- bullet list of files created/modified, features built, issues resolved

**Decisions Made**:
- each decision and its rationale (WHY, not just what)

**Blockers and Open Questions**:
- anything unresolved

**Recommended Next Steps**:
1. ordered by priority

**Files to Read on Resume**:
- [[filename]] — why it matters
```

## Step 4: Update the index files
IMPORTANT: Use the edit tool. Do NOT repeat existing section headers — only append new content under them.

Edit `<brain-root>/BRAIN-INDEX.md`: find the existing "## Session Log" section and append a new line `- Session N: <timestamp> — <one-line summary>` under it. Do not add another "## Session Log" header.

Edit `<brain-root>/Handoffs/Handoffs.md`: find the existing "## Session History" section and append `- [[handoff-<NNN>]]` under it. Do not add another "## Session History" header.

## Step 5: Update the execution plan
Read the execution plan file. Mark completed steps as `completed`. Mark started-but-unfinished steps as `in_progress`.

Tell the user: "Session saved. Run /walnut:resume-walnut next time to pick up right where you left off."
