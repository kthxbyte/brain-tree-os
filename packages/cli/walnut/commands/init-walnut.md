---
name: init-walnut
description: Initialize a new Walnut brain from scratch
agent: build
---

# Initialize Brain

## Brain Detection
Run: `brain-tree-os find-brain --here`
If output contains "FOUND:", tell the user: "A brain already exists here. Use /walnut:resume-walnut to continue." Stop.

## Step 1: Ask the user
Ask: "What would you like to name this brain?"
Ask: "Give a short description (optional, press Enter to skip)."
Ask: "List the folders you want (space-separated, e.g. Research Vision Build). Press Enter to use defaults: Research, Notes."

## Step 2: Build the scaffold
Run `brain-tree-os uuid` and save the result as <uuid>.
Run: `brain-tree-os init-scaffold <current-directory> "<brain-name>" <uuid> <folder1> <folder2> ...`

This creates BRAIN-INDEX.md, CLAUDE.md, Execution-Plan.md, folder index files, and registers the brain.

## Step 3: Fill in the content
Edit CLAUDE.md and write the brain's purpose under "What Is This Brain?".
Edit Execution-Plan.md and replace the placeholder Phase 1 table with real tasks based on what the user told you.
For each custom folder the user requested, create 2-3 content files with relevant starting content. Each file must start with `> Part of [[FolderName]]`.

## Step 4: Go live
Run: `brain-tree-os registry-set <uuid> status live`
Tell the user: "Your brain is ready. Run /walnut:resume-walnut to start your first session."
