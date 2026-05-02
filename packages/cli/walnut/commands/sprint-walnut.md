---
name: sprint-walnut
description: Plan a focused week of work from the execution plan — identifies unblocked steps and builds a day-by-day schedule
agent: build
---

**You are now executing the sprint-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Sprint Planning

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty. If empty, tell the user: "No brain found." Stop.
Extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Get data
Run: `brain-tree-os status-data <brain-root>` for step counts and in-progress steps.
Run: `brain-tree-os now --short` for today's date.
Read the execution plan file for full step details and dependencies.
Read the latest handoff file for last session context.

## Step 2: Identify work
From the execution plan, collect:
- In-progress steps (finish these first)
- Not_started steps whose dependencies are all completed (unblocked)
For each, estimate effort: S (< 1hr), M (half-day), L (full day).

## Step 3: Propose the sprint
Present a day-by-day plan for the week, grouped by theme. Highlight steps that can run in parallel.
Include a buffer slot for unexpected work.
Ask the user to confirm or adjust.

## Step 4: Save and close
IMPORTANT: Use the write tool to create files and the edit tool to modify existing files. Do NOT use bash commands like vim, nano, cat, or touch.

Use the write tool to create `Execution-Plan/Sprint-<date>.md`, starting with `> Part of [[Execution-Plan]]`.
Suggest starting with /walnut:plan-walnut <first-step> for task-level breakdown.
