---
name: feature-walnut
description: Plan and track a new feature — creates a spec file and links it to the execution plan
agent: build
---

# Feature Planning

## Brain Detection
Run: `brain-tree-os find-brain`
If no "FOUND:" in output, tell the user: "No brain found." Stop.

## Step 1: Understand the feature
If the user described the feature in the command (e.g. /walnut:feature-walnut dark mode), use that as the starting point.
Otherwise ask: "What feature do you want to build? Describe what it does and why it matters."

## Step 2: Search existing context
Search the brain for files related to the feature topic (grep for key terms).
Read the execution plan to check if this feature maps to an existing step.

## Step 3: Create the spec
Write a feature spec at `<relevant-folder>/Feature-<Name>.md`, starting with `> Part of [[FolderIndex]]`.
Include: Summary, Motivation, Requirements (checklist), Technical Approach, Dependencies, Open Questions.
Add a wikilink to the spec from the folder index.

## Step 4: Update the plan
If the feature maps to an existing execution plan step, mark it as `in_progress` and reference the spec.
If it is new, ask: "This isn't in your plan. Should I add it as a new step?" If yes, add it.

Ask if the user wants to start implementing now. If yes, break the spec requirements into tasks and begin.
