---
name: recover-braintree
description: Use when the user wants to recover or register a brain-tree-os project in the brain viewer after migrating or copying the brain files to a new location.
---

**START NOW. Run this command immediately, before doing anything else:**

```
brain-tree-os find-brain
```

- If it printed a path -> check if brain already registered, proceed to register if needed.
- If it printed nothing -> tell user to navigate to the brain directory.

---

# Brain Recovery - Full Instructions

Register a brain-tree-os project in the global registry so it appears in the brain viewer.

## Step 1: Check If Brain Already Registered

1. Use Bash to run `brain-tree-os home` to get the home directory
2. Use Read on `<home>/.braintree-os/brains.json` to see if this brain is already registered

If the brain is already registered, tell the user: "Your brain is already registered! It should appear in the brain viewer at http://localhost:PORT/brains"

## Step 2: Register the Brain

If the brain is NOT registered, use Bash to run:

```
brain-tree-os recover-braintree [path]
```

With the brain's directory path. The default is the current directory.

When successful, the command outputs "Registered brain: [name]"

## Step 3: Verify

After registration, tell the user: "Your brain has been recovered! It should now appear in the brain viewer at http://localhost:PORT/brains"

If the viewer server is not running, tell them: "Run `brain-tree-os` in a terminal to start the viewer server."
