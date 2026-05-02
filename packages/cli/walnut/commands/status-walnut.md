---
name: status-walnut
description: Show a visual progress dashboard for a Walnut brain
agent: build
---

# Brain Status

## Brain Detection
Run: `brain-tree-os find-brain`
If no "FOUND:" in output, tell the user: "No brain found. Run /walnut:init-walnut to create one." Stop.

## Step 1: Get data
Run: `brain-tree-os status-data <brain-root>`

The command returns JSON with: phases (step counts by status), overall totals, folders (file counts), total_files, wikilink_count, orphan_files, session_count.

## Step 2: Present the dashboard
Render from the JSON:
- ASCII progress bar per phase: `[====------] 40% (4/10 steps)`
- Overall progress bar
- Folder table: name and file count per folder
- Graph health line: total files, wikilink count, orphan count

If orphan_files is non-empty, suggest: "Run /walnut:sync-walnut to fix disconnected files."
If overall.in_progress > 0, list the in-progress steps and suggest /walnut:resume-walnut.
