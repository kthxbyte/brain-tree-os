---
name: sync-walnut
description: Audit and fix health issues in a Walnut brain — orphans, broken links, empty folders, index gaps
agent: build
---

**You are now executing the sync-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Brain Sync

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty. If empty, tell the user: "No brain found." Stop.
Extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Get audit data
Run: `brain-tree-os sync-audit <brain-root>`

The command returns JSON with: orphan_files, broken_links (source + target), empty_folders, index_mismatches (folder + missing_from_index + broken_in_index).

## Step 2: Fix automatically
IMPORTANT: Use the edit tool to modify existing files and the write tool to create new ones. Do NOT use bash commands like vim, nano, cat, or touch.

**Orphans**: For each orphan file, use the edit tool to add `> Part of [[FolderName]]` to the file and add a wikilink from the appropriate folder index.
**Broken links**: If the target is clearly a renamed file, fix the link. For ambiguous cases, ask the user.
**Index mismatches**: For each missing_from_index entry, edit the folder index to add the missing wikilink.

## Step 3: Report
Present a sync report:
- Files scanned, orphans fixed, broken links fixed, index gaps fixed
- empty_folders: ask the user whether to seed content or leave as-is. Do NOT delete without asking.
- Any issues that needed user input and their resolution

End with a graph health summary: total files, wikilinks, remaining orphans.
