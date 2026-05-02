---
name: recover-walnut
description: Re-register a Walnut brain in the global registry after migrating or copying to a new location
agent: build
---

# Brain Recovery

## Step 1: Register
Run: `brain-tree-os recover-braintree <path-to-brain>`

If no path is provided, use the current directory.

The command scans for `.braintree/brain.json` or `BRAIN-INDEX.md` and registers the brain in `~/.braintree-os/brains.json`. It prints "Registered brain: <name>" on success or "Brain already registered" if it was already there.

## Step 2: Confirm
Tell the user: "Brain recovered. Run `brain-tree-os` to start the viewer and see it at http://localhost:3000/brains"
