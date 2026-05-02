---
name: sprint-walnut
description: Plan a focused week of work from the execution plan — identifies unblocked steps and builds a day-by-day schedule
agent: build
---

# Sprint Planning

## Brain Detection
Run: `brain-tree-os find-brain`
If no "FOUND:" in output, tell the user: "No brain found." Stop.

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
Write the sprint plan to `Execution-Plan/Sprint-<date>.md`, starting with `> Part of [[Execution-Plan]]`.
Suggest starting with /walnut:plan-walnut <first-step> for task-level breakdown.
