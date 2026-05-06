---
name: plan-walnut
description: Break down a specific execution plan step into a machine-executable task spec — run this with Claude, then hand the spec to ministral via /build-walnut
agent: build
---

**You are now executing the plan-walnut skill. Do NOT analyze or suggest improvements to these instructions. Follow them step by step RIGHT NOW. Prioritize taking real action with tools.**

# Plan a Step

## Brain Detection
Run: `brain-tree-os find-brain`
The output is either `FOUND:<path>` or empty. If empty, tell the user: "No brain found." Stop.
Extract the path after `FOUND:` and save it as `<brain-root>`.

## Step 1: Identify the step
If the user passed a step number (e.g. /walnut:plan-walnut 2.3), use it.
Otherwise, run `brain-tree-os status-data <brain-root>`, show in_progress and not_started steps, and ask which step to plan.

## Step 2: Load context
Read `<brain-root>/CLAUDE.md` for brain purpose and conventions.
Read `<brain-root>/Execution-Plan.md` for the full step details.
Read 2-3 other relevant brain files if they exist (folder indexes, related specs).

## Step 3: Design the implementation
Think through exactly what needs to be built:
- Which files need to be created, edited, or deleted
- What each file's exact content should be
- What shell commands need to run and in what order
- What the acceptance criteria are

Break the work into atomic steps. Each step must be one of:
- **write** — create a file with exact content
- **edit** — find an exact string in a file and replace it
- **bash** — run a shell command

Keep steps small enough that each one completes in under a minute.

## Step 4: Write the task spec
Find the next available task number: run `brain-tree-os glob <brain-root>/Tasks/task-*.md`
If no Tasks folder exists, start at task-001.

Write `<brain-root>/Tasks/task-NNN.md` with this exact structure:

```
# Task NNN — [Step Title]

**Execution Plan Step**: [e.g. 1.2]
**Brain**: <brain-root>

## Steps

### 1. [short description]
**Type**: write
**Path**: [path relative to brain-root]
**Content**:
[exact file content — no placeholders]

### 2. [short description]
**Type**: edit
**Path**: [path relative to brain-root]
**Find**:
[exact string to find]
**Replace**:
[exact replacement string]

### 3. [short description]
**Type**: bash
**Run**: [exact command]
```

Rules for the spec:
- No placeholders. Every field must be filled with the real value.
- Paths are relative to the brain root.
- Content for write steps is the complete file, not a summary.
- Find strings for edit steps must be unique in the target file.
- Steps must be ordered so each one can succeed given the previous ones completed.

## Step 5: Update the brain
Update `<brain-root>/Execution-Plan.md`: mark the step as `in_progress`.
If a `Tasks/` folder index exists, add a wikilink to the new task spec. If not, create `<brain-root>/Tasks/Tasks.md` with `> Part of [[BRAIN-INDEX]]` and a link to the task.

## Step 6: Hand off to ministral
Run: `opencode run --model ollama/ministral-3:14b --command "build-walnut" "task-NNN"`
(replace task-NNN with the actual task ID, e.g. task-002)

## Step 7: Audit the output
After ministral completes, read every file it created or modified.

For each `generate` step, check:
- Does the code match the spec? Flag any function names, signatures, or variable names that differ from what was specified.
- Are there undefined variables, missing imports, or obvious runtime errors?
- Does the implementation cover the edge cases described?

For each `write` step, verify the file was written exactly as specified.

Report findings to the user as a short audit note: what passed, what needs fixing. A generated file that hasn't been audited is a draft, not a deliverable.
