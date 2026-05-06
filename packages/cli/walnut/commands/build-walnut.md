---
name: build-walnut
description: Execute a task spec written by plan-walnut — run this with ministral to generate code and files
agent: build
---

**You are now executing the build-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Execute a Task Spec

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty. If empty, tell the user: "No brain found." Stop.
Extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Load the task spec
The user passed a task ID as an argument (e.g. /walnut:build-walnut task-001).
Read `<brain-root>/Tasks/<task-id>.md`.
If the file does not exist, tell the user: "Task spec not found: Tasks/<task-id>.md" and stop.

## Step 2: Execute each step in order
Read the Steps section of the task spec.
For each step, execute it based on its Type field:

**If Type is `write`**:
Use the write tool to create the file at the given Path (relative to brain-root).
The Content field is the complete file content — write it exactly as given.

**If Type is `edit`**:
Use the edit tool on the file at the given Path.
The Find field is the exact string to locate. The Replace field is the exact replacement.
Do not paraphrase. Use the exact strings from the spec.

**If Type is `bash`**:
Run the exact command in the Run field using the bash tool.

**If Type is `generate`**:
Read the Description field carefully. It specifies the functionality, interface, and constraints for a code file. Write a complete, working implementation at the given Path using the write tool. Generate real, runnable code — not pseudocode or placeholders. The Description is the full specification; do not ask for clarification.

After each step: move immediately to the next one. Do not pause, do not summarize, do not ask for confirmation.

## Step 3: Report completion
After all steps are done, tell the user:
"Done. All N steps from Tasks/<task-id>.md executed."
List each step with a checkmark: ✓ 1. [description]
