---
name: init-walnut
description: Initialize a new Walnut brain from scratch
agent: build
---

**You are now executing the init-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Initialize Brain

## Brain Detection
Run: `brain-tree-os find-brain --here`
The output is either `FOUND:<path>` or empty. If `FOUND:`, tell the user: "A brain already exists here. Use /walnut:resume-walnut to continue." Stop.

## Step 1: Ask the user
Ask: "What would you like to name this brain?"
Ask: "Give a short description (optional, press Enter to skip)."
Ask: "List the folders you want (space-separated, e.g. Research Vision Build). Press Enter to use defaults: Research, Notes."

## Step 2: Build the scaffold
Run `brain-tree-os uuid` and save the result as <uuid>.
Run: `brain-tree-os init-scaffold <current-directory> "<brain-name>" "<description>" <uuid> <folder1> <folder2> ...`
If the user skipped the description, pass an empty string: `""`

This creates BRAIN-INDEX.md, CLAUDE.md, Execution-Plan.md, folder index files, and registers the brain.

## Step 3: Create initialization handoff
IMPORTANT: Do this immediately after the scaffold. Do not wait. Do not ask for confirmation.

Get the current date and time: run `brain-tree-os now`

Write `Handoffs/handoff-000.md` with this structure:
```
> Part of [[Handoffs]]

**Date**: <date and time>

# Handoff 000 — Brain Initialized

## Summary
<2-3 sentences: what this brain is for, what was created>

## What Was Done
- Brain scaffold created with UUID: <uuid>
- Folders initialized: <list of folders>

## Recommended Next Steps
<2-3 specific first actions based on the brain's purpose>

## Files to Read on Resume
- [[CLAUDE.md]] — Brain purpose and conventions
- [[Execution-Plan]] — Initial task roadmap
```

Then edit `Handoffs/Handoffs.md` to add under the Session History section:
`- [[handoff-000]] — Brain initialized. <date>`

Do not repeat existing section headers. Only append the new line under the existing Session History section.

## Step 4: Go live
Run: `brain-tree-os registry-set <uuid> status live`
Tell the user: "Your brain is ready. Run /walnut:resume-walnut to start your first session."

## Step 5: Fill in the content
Use the edit tool on CLAUDE.md to fill in the brain's purpose under "What Is This Brain?".
Use the edit tool on Execution-Plan.md to replace the placeholder Phase 1 table with real tasks based on what the user told you.
For each custom folder the user requested, use the write tool to create 2-3 content files with relevant starting content. Each file must start with `> Part of [[FolderName]]`.
