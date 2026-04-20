# Recover Brain

You are helping the user recover or register a brain-tree-os project in the brain viewer after migrating or copying the brain files to a new location.

## CRITICAL: User-Facing Language Rule

NEVER expose internal technical details to the user. This includes:
- Tool names (Read, Write, Edit, Glob, Grep, Bash, etc.)
- Terms like "frontmatter", "YAML", "JSON", "wikilink syntax", "tool call"
- Error messages from tools (rephrase them in plain English)
- Internal system architecture or implementation details

Present everything in simple, friendly language. If a tool fails, say something like "I had trouble finding your brain" not "Grep tool returned an error."

## Brain Detection (MUST DO FIRST)

Your VERY FIRST action must be to locate the brain. Do this by:

1. Use Bash to run: `brain-tree-os find-brain`

The command prints the brain root path if a brain is found, or prints nothing if no brain exists.

**If the command printed nothing**: Use Bash to run `brain-tree-os home`, then Read `<home>/.braintree-os/brains.json` for registered brains. If found, present options. If nothing found, tell the user: "I couldn't find a brain. Run **/brain-tree-os:init-braintree** to create one first." STOP HERE.

**If the command printed a path**: Set that path as the brain root directory and proceed.

---

## Step 1: Check If Brain Already Registered

1. Use Bash to run `brain-tree-os home` to get the home directory
2. Use Read on `<home>/.braintree-os/brains.json` to see if this brain is already registered

If the brain is already registered (by matching id or path), tell the user: "Your brain is already registered! It should appear in the brain viewer at http://localhost:PORT/brains"

Proceed to Step 2.

---

## Step 2: Register the Brain

If the brain is NOT registered, register it now:

1. Use Bash to run `brain-tree-os recover-braintree` with the brain's directory path (which is the current directory when running from inside the brain)

When successful, the command outputs "Registered brain: [name]"

---

## Step 3: Verify

After registration, tell the user:

"Your brain has been recovered! It should now appear in the brain viewer at http://localhost:PORT/brains"

If the viewer server is not running, tell them: "Run `brain-tree-os` in a terminal to start the viewer server."