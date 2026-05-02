---
name: resume-walnut
description: Resume work on a Walnut brain — loads context and recommends next steps
agent: build
---

# Resume Brain Session

## Brain Detection
Run: `brain-tree-os find-brain`
If no "FOUND:" in output, tell the user: "No brain found. Run /walnut:init-walnut to create one." Stop.

## Step 1: Load context
Run: `brain-tree-os resume-context <brain-root>`

The command returns JSON with: brain_name, latest_handoff (path + full content), in_progress_steps, and folders.

## Step 2: Present status
From the JSON:
- Show the brain name and a 2-3 sentence recap of the latest handoff summary
- Show in_progress_steps as the current priorities
- Show a brief folder list

## Step 3: Ask what to work on
Present in_progress_steps as a numbered list of options, plus "Something else."
Wait for the user to choose, then start working immediately.
