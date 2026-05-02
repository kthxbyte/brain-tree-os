---
name: plan-walnut
description: Break down a specific execution plan step into concrete tasks — pass a step number or choose from available steps
agent: build
---

# Plan a Step

## Brain Detection
Run: `brain-tree-os find-brain`
If no "FOUND:" in output, tell the user: "No brain found." Stop.

## Step 1: Identify the step
If the user passed a step number (e.g. /walnut:plan-walnut 2.3), use it.
Otherwise, run `brain-tree-os status-data <brain-root>`, show in_progress and not_started steps, and ask which step to plan.

## Step 2: Load context
Read the execution plan file for the step's full details.
Read 2-3 relevant brain files for context (folder index, related specs, BRAIN-INDEX).

## Step 3: Plan and save
IMPORTANT: Use the write tool to create files and the edit tool to modify existing files. Do NOT use bash commands like vim, nano, cat, or touch.

Break the step into concrete tasks with effort estimates (S < 1hr / M half-day / L full-day).
Present as a numbered checklist. Use the write tool to save as `<relevant-folder>/Plan-Step-<N>.md`, starting with `> Part of [[FolderIndex]]`.
Add a wikilink to it from the folder index.
Update the execution plan: mark the step as `in_progress`.

Ask if the user wants to start executing now.
