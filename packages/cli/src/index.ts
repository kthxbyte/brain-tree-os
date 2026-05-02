#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import * as net from 'node:net'

const CONFIG_DIR = path.join(os.homedir(), '.braintree-os')
const OPENCODEDIR = 'opencode'
const OPENCODECMD_DIR = path.join(os.homedir(), '.config', OPENCODEDIR, 'commands')
const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'commands')
const SERVER_JSON = path.join(CONFIG_DIR, 'server.json')

const VERSION = '0.1.0'

function findBrain(hereOnly = false) {
  let dir = process.cwd()
  const root = path.parse(dir).root
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.braintree', 'brain.json'))) {
      console.log(`FOUND:${dir}`)
      return
    }
    if (fs.existsSync(path.join(dir, 'BRAIN-INDEX.md'))) {
      console.log(`FOUND:${dir}`)
      return
    }
    if (hereOnly) break
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
}

function formatNow(short = false): string {
  const now = new Date()
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  if (short) return date
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} at ${time}`
}

function registrySet(brainId: string, key: string, value: string) {
  const registryPath = path.join(os.homedir(), '.braintree-os', 'brains.json')
  if (!fs.existsSync(registryPath)) {
    process.stderr.write(`Registry not found: ${registryPath}\n`)
    process.exit(1)
  }
  const config = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  const brain = config.brains.find((b: any) => b.id === brainId)
  if (!brain) {
    process.stderr.write(`Brain not found: ${brainId}\n`)
    process.exit(1)
  }
  brain[key] = value
  fs.writeFileSync(registryPath, JSON.stringify(config, null, 2) + '\n')
}

function recoverBrain(scanPath: string) {
  const targetPath = scanPath || process.cwd()

  if (!fs.existsSync(targetPath)) {
    process.stderr.write(`Path not found: ${targetPath}\n`)
    process.exit(1)
  }

  const brainJsonPath = path.join(targetPath, '.braintree', 'brain.json')
  const brainIndexPath = path.join(targetPath, 'BRAIN-INDEX.md')

  let brainData: any = null

  if (fs.existsSync(brainJsonPath)) {
    brainData = JSON.parse(fs.readFileSync(brainJsonPath, 'utf8'))
  } else if (fs.existsSync(brainIndexPath)) {
    const content = fs.readFileSync(brainIndexPath, 'utf8')
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const descMatch = content.match(/^>\s+(.+)$/m)
    const createdMatch = content.match(/\*\*Created\*\*:\s*(.+)$/m)

    brainData = {
      id: crypto.randomUUID(),
      name: titleMatch ? titleMatch[1] : path.basename(targetPath),
      description: descMatch ? descMatch[1] : '',
      created: createdMatch ? createdMatch[1] : new Date().toISOString().split('T')[0],
      status: 'live'
    }
  } else {
    process.stderr.write(`No brain found at: ${targetPath}\n`)
    process.stderr.write(`Expected .braintree/brain.json or BRAIN-INDEX.md\n`)
    process.exit(1)
  }

  const registryPath = path.join(os.homedir(), '.braintree-os', 'brains.json')
  ensureConfigDir()

  let config: { brains: any[] } = { brains: [] }
  if (fs.existsSync(registryPath)) {
    config = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  }

  const existing = config.brains.find((b: any) => b.id === brainData.id)
  if (existing) {
    console.log(`Brain already registered: ${brainData.name}`)
    return
  }

  config.brains.push({
    id: brainData.id,
    name: brainData.name,
    description: brainData.description,
    path: targetPath,
    created: brainData.created,
    status: brainData.status || 'live'
  })

  fs.writeFileSync(registryPath, JSON.stringify(config, null, 2) + '\n')
  console.log(`Registered brain: ${brainData.name}`)
}

function ensureConfigDir() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
  const configFile = path.join(CONFIG_DIR, 'brains.json')
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify({ brains: [] }, null, 2) + '\n')
  }
}

// ─── Walnut subcommands ────────────────────────────────────────────────────

function getAllMdFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) results.push(...getAllMdFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full)
  }
  return results
}

function readExecPlan(brainRoot: string): string {
  const candidates = [
    path.join(brainRoot, 'Execution-Plan', 'Execution-Plan.md'),
    path.join(brainRoot, 'Execution-Plan.md'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8')
  }
  return ''
}

function parseExecPlan(content: string) {
  type Phase = { name: string; total: number; completed: number; in_progress: number; not_started: number; blocked: number }
  const phases: Phase[] = []
  let current: Phase | null = null
  for (const line of content.split('\n')) {
    const phaseMatch = line.match(/^##\s+(Phase\s+\d+[^|#\n]*)/)
    if (phaseMatch) {
      if (current) phases.push(current)
      current = { name: phaseMatch[1].trim(), total: 0, completed: 0, in_progress: 0, not_started: 0, blocked: 0 }
      continue
    }
    if (!current || !line.startsWith('|')) continue
    if (line.includes('---') || /^\|\s*(step|title)/i.test(line)) continue
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length < 3) continue
    const status = cols[2].replace(/`/g, '').toLowerCase()
    current.total++
    if (status === 'completed' || status === 'done') current.completed++
    else if (status === 'in_progress') current.in_progress++
    else if (status === 'blocked') current.blocked++
    else current.not_started++
  }
  if (current) phases.push(current)
  return phases
}

function resumeContext(brainRoot: string) {
  let brainName = path.basename(brainRoot)
  const brainJsonPath = path.join(brainRoot, '.braintree', 'brain.json')
  if (fs.existsSync(brainJsonPath)) {
    try { const d = JSON.parse(fs.readFileSync(brainJsonPath, 'utf8')); if (d.name) brainName = d.name } catch { /* ignore */ }
  } else {
    const indexPath = path.join(brainRoot, 'BRAIN-INDEX.md')
    if (fs.existsSync(indexPath)) {
      const m = fs.readFileSync(indexPath, 'utf8').match(/^#\s+(.+)$/m)
      if (m) brainName = m[1]
    }
  }

  const handoffsDir = path.join(brainRoot, 'Handoffs')
  let latestHandoff: { path: string; content: string } | null = null
  if (fs.existsSync(handoffsDir)) {
    const files = fs.readdirSync(handoffsDir).filter(f => /^handoff-\d+\.md$/.test(f)).sort()
    if (files.length > 0) {
      const p = path.join(handoffsDir, files[files.length - 1])
      latestHandoff = { path: p, content: fs.readFileSync(p, 'utf8') }
    }
  }

  const inProgressSteps: string[] = []
  for (const line of readExecPlan(brainRoot).split('\n')) {
    if (!line.startsWith('|') || line.includes('---')) continue
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length >= 3 && cols[2].replace(/`/g, '').toLowerCase() === 'in_progress') {
      inProgressSteps.push(`${cols[0]}: ${cols[1]}`)
    }
  }

  const folders = fs.existsSync(brainRoot)
    ? fs.readdirSync(brainRoot, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
        .map(e => e.name)
    : []

  console.log(JSON.stringify({ brain_name: brainName, brain_root: brainRoot, latest_handoff: latestHandoff, in_progress_steps: inProgressSteps, folders }, null, 2))
}

function statusData(brainRoot: string) {
  const phases = parseExecPlan(readExecPlan(brainRoot))
  const overall = phases.reduce(
    (acc, p) => ({ total: acc.total + p.total, completed: acc.completed + p.completed, in_progress: acc.in_progress + p.in_progress, not_started: acc.not_started + p.not_started, blocked: acc.blocked + p.blocked }),
    { total: 0, completed: 0, in_progress: 0, not_started: 0, blocked: 0 }
  )

  const folders: Array<{ name: string; files: number }> = []
  if (fs.existsSync(brainRoot)) {
    for (const entry of fs.readdirSync(brainRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
      folders.push({ name: entry.name, files: getAllMdFiles(path.join(brainRoot, entry.name)).length })
    }
  }

  const allFiles = getAllMdFiles(brainRoot)
  let wikilinkCount = 0
  const orphanFiles: string[] = []
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8')
    wikilinkCount += (content.match(/\[\[[^\]]+\]\]/g) || []).length
    const name = path.basename(file, '.md').toUpperCase()
    if (!content.includes('> Part of') && name !== 'BRAIN-INDEX' && name !== 'CLAUDE') {
      orphanFiles.push(path.relative(brainRoot, file))
    }
  }

  const handoffsDir = path.join(brainRoot, 'Handoffs')
  const sessionCount = fs.existsSync(handoffsDir)
    ? fs.readdirSync(handoffsDir).filter(f => /^handoff-\d+\.md$/.test(f)).length
    : 0

  console.log(JSON.stringify({ phases, overall, folders, total_files: allFiles.length, wikilink_count: wikilinkCount, orphan_files: orphanFiles, session_count: sessionCount }, null, 2))
}

function syncAudit(brainRoot: string) {
  const allFiles = getAllMdFiles(brainRoot)

  // Build filename → relative-path lookup for link resolution
  const nameMap = new Map<string, string[]>()
  for (const file of allFiles) {
    const rel = path.relative(brainRoot, file).replace(/\\/g, '/')
    const base = path.basename(file, '.md').toLowerCase()
    if (!nameMap.has(base)) nameMap.set(base, [])
    nameMap.get(base)!.push(rel)
  }

  const orphanFiles: string[] = []
  const brokenLinks: Array<{ source: string; target: string }> = []
  const fileLinks = new Map<string, string[]>()

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const rel = path.relative(brainRoot, file).replace(/\\/g, '/')
    const links = (content.match(/\[\[([^\]|]+)[^\]]*\]\]/g) || []).map(l => l.slice(2, -2).split('|')[0].trim())
    fileLinks.set(rel, links)

    const name = path.basename(file, '.md').toUpperCase()
    if (!content.includes('> Part of') && name !== 'BRAIN-INDEX' && name !== 'CLAUDE') {
      orphanFiles.push(rel)
    }
  }

  for (const [source, links] of fileLinks) {
    for (const link of links) {
      if (!nameMap.has(path.basename(link, '.md').toLowerCase())) {
        brokenLinks.push({ source, target: link })
      }
    }
  }

  const emptyFolders: string[] = []
  const indexMismatches: Array<{ folder: string; missing_from_index: string[]; broken_in_index: string[] }> = []

  if (fs.existsSync(brainRoot)) {
    for (const entry of fs.readdirSync(brainRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const folderPath = path.join(brainRoot, entry.name)
      const folderFiles = getAllMdFiles(folderPath)

      if (folderFiles.length <= 1) emptyFolders.push(entry.name)

      const indexPath = path.join(folderPath, `${entry.name}.md`)
      if (!fs.existsSync(indexPath)) continue
      const indexContent = fs.readFileSync(indexPath, 'utf8')
      const indexLinks = (indexContent.match(/\[\[([^\]|]+)[^\]]*\]\]/g) || [])
        .map(l => l.slice(2, -2).split('|')[0].trim().toLowerCase())
      const actualFiles = folderFiles
        .map(f => path.basename(f, '.md').toLowerCase())
        .filter(n => n !== entry.name.toLowerCase())
      const missingFromIndex = actualFiles.filter(f => !indexLinks.includes(f))
      const brokenInIndex = indexLinks.filter(l => !nameMap.has(l))
      if (missingFromIndex.length > 0 || brokenInIndex.length > 0) {
        indexMismatches.push({ folder: entry.name, missing_from_index: missingFromIndex, broken_in_index: brokenInIndex })
      }
    }
  }

  console.log(JSON.stringify({ orphan_files: orphanFiles, broken_links: brokenLinks, empty_folders: emptyFolders, index_mismatches: indexMismatches }, null, 2))
}

function nextHandoffNumber(brainRoot: string) {
  const handoffsDir = path.join(brainRoot, 'Handoffs')
  const count = fs.existsSync(handoffsDir)
    ? fs.readdirSync(handoffsDir).filter(f => /^handoff-\d+\.md$/.test(f)).length
    : 0
  console.log(String(count).padStart(3, '0'))
}

function initScaffold(brainRoot: string, brainName: string, uuid: string, folders: string[]) {
  if (!brainRoot || !brainName || !uuid) {
    process.stderr.write('Usage: brain-tree-os init-scaffold <brain-root> <name> <uuid> [folder1 folder2 ...]\n')
    process.exit(1)
  }

  const allFolders = [...new Set(['Handoffs', 'Assets', ...folders])]
  const date = new Date().toISOString().split('T')[0]
  const folderLinks = allFolders.map(f => `- [[${f}]]`).join('\n')

  fs.mkdirSync(path.join(brainRoot, '.braintree'), { recursive: true })
  fs.writeFileSync(path.join(brainRoot, '.braintree', 'brain.json'), JSON.stringify(
    { id: uuid, name: brainName, description: '', created: date, version: '1.0.0' }, null, 2) + '\n')

  fs.writeFileSync(path.join(brainRoot, 'BRAIN-INDEX.md'),
    `# ${brainName}\n\n**Created**: ${date}\n\n## Folders\n${folderLinks}\n\n## Root Files\n- [[CLAUDE.md]]\n- [[Execution-Plan]]\n\n## Session Log\n- Session 0: Brain initialized. ${date}\n`)

  fs.writeFileSync(path.join(brainRoot, 'CLAUDE.md'),
    `> Part of [[BRAIN-INDEX]]\n\n# ${brainName} — Agent Instructions\n\n## What Is This Brain?\n[Describe the brain purpose here.]\n\n## Brain Structure\n${folderLinks}\n\n## Conventions\n- Use [[wikilinks]] for all cross-references between notes\n- Update Handoffs/ at the end of every work session\n- Reference [[Execution-Plan]] as the source of truth for build order\n`)

  fs.writeFileSync(path.join(brainRoot, 'Execution-Plan.md'),
    `> Part of [[BRAIN-INDEX]]\n\n# Execution Plan\n\n## Phase 1: Foundation\n\n| Step | Title | Status | Notes |\n|---|---|---|---|\n| 1.1 | Define goals | \`not_started\` | |\n`)

  for (const folder of allFolders) {
    const folderPath = path.join(brainRoot, folder)
    fs.mkdirSync(folderPath, { recursive: true })
    const indexFile = path.join(folderPath, `${folder}.md`)
    if (fs.existsSync(indexFile)) continue
    if (folder === 'Handoffs') {
      fs.writeFileSync(indexFile,
        `# Handoffs\n\n> Part of [[BRAIN-INDEX]]\n\nSession continuity notes.\n\n## Session History\n`)
    } else if (folder === 'Assets') {
      fs.writeFileSync(indexFile,
        `# Assets\n\n> Part of [[BRAIN-INDEX]]\n\nDrop any files here for AI agents to analyze.\n`)
    } else {
      fs.writeFileSync(indexFile,
        `# ${folder}\n\n> Part of [[BRAIN-INDEX]]\n\n[Describe this area here.]\n\n## Key Files\n`)
    }
  }

  ensureConfigDir()
  const registryPath = path.join(os.homedir(), '.braintree-os', 'brains.json')
  let config: { brains: any[] } = { brains: [] }
  if (fs.existsSync(registryPath)) {
    try { config = JSON.parse(fs.readFileSync(registryPath, 'utf8')) } catch { /* ignore */ }
  }
  if (!config.brains.find((b: any) => b.id === uuid)) {
    config.brains.push({ id: uuid, name: brainName, description: '', path: brainRoot, created: date, status: 'building' })
    fs.writeFileSync(registryPath, JSON.stringify(config, null, 2) + '\n')
  }

  console.log(JSON.stringify({ created_folders: allFolders, brain_root: brainRoot, id: uuid }, null, 2))
}

async function installCommands(): Promise<{ claude: number; opencode: number; walnut: number }> {
  let claudeCount = 0
  let opencodeCount = 0
  let walnutCount = 0

  // Install Claude/OpenClaude commands
  fs.mkdirSync(CLAUDE_DIR, { recursive: true })
  const claudeCommandsSource = path.join(__dirname, '..', 'claude', 'commands')
  if (fs.existsSync(claudeCommandsSource)) {
    const claudeFiles = fs.readdirSync(claudeCommandsSource).filter(f => f.endsWith('.md'))
    for (const file of claudeFiles) {
      const dest = path.join(CLAUDE_DIR, file)
      fs.copyFileSync(path.join(claudeCommandsSource, file), dest)
    }
    claudeCount = claudeFiles.length
  }

  // Install OpenCode commands
  fs.mkdirSync(OPENCODECMD_DIR, { recursive: true })
  const opencodeCommandsSource = path.join(__dirname, '..', 'opencode', 'commands')
  if (fs.existsSync(opencodeCommandsSource)) {
    const opencodeFiles = fs.readdirSync(opencodeCommandsSource).filter(f => f.endsWith('.md'))
    for (const file of opencodeFiles) {
      const dest = path.join(OPENCODECMD_DIR, file)
      fs.copyFileSync(path.join(opencodeCommandsSource, file), dest)
    }
    opencodeCount = opencodeFiles.length
  }

  // Install Walnut commands (both OpenCode and Claude)
  const walnutCommandsSource = path.join(__dirname, '..', 'walnut', 'commands')
  if (fs.existsSync(walnutCommandsSource)) {
    const walnutFiles = fs.readdirSync(walnutCommandsSource).filter(f => f.endsWith('.md'))
    for (const file of walnutFiles) {
      fs.copyFileSync(path.join(walnutCommandsSource, file), path.join(OPENCODECMD_DIR, file))
      fs.copyFileSync(path.join(walnutCommandsSource, file), path.join(CLAUDE_DIR, file))
    }
    walnutCount = walnutFiles.length
  }

  return { claude: claudeCount, opencode: opencodeCount, walnut: walnutCount }
}

async function findFreePort(preferred: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(preferred, () => {
      server.close(() => resolve(preferred))
    })
    server.on('error', () => {
      // Port in use, find a random free one
      const server2 = net.createServer()
      server2.listen(0, () => {
        const port = (server2.address() as net.AddressInfo).port
        server2.close(() => resolve(port))
      })
    })
  })
}

async function openBrowser(url: string) {
  try {
    const open = (await import('open')).default
    await open(url)
  } catch {
    // Browser open failed silently, URL is shown in welcome message
  }
}

function saveServerConfig(port: number) {
  fs.writeFileSync(
    SERVER_JSON,
    JSON.stringify({ port, pid: process.pid, startedAt: new Date().toISOString() }, null, 2) + '\n'
  )
}

function cleanupServerConfig() {
  try {
    if (fs.existsSync(SERVER_JSON)) {
      fs.unlinkSync(SERVER_JSON)
    }
  } catch {
    // ignore cleanup errors
  }
}

function showWelcome(port: number, counts: { claude: number; opencode: number; walnut: number }) {
  const url = `http://localhost:${port}/brains`
  console.log('')
  console.log(`  BrainTree OS v${VERSION}`)
  console.log('')
  if (counts.claude > 0) {
    console.log(`  > ${counts.claude} commands installed to ${CLAUDE_DIR}`)
  }
  if (counts.opencode > 0) {
    console.log(`  > ${counts.opencode} commands installed to ${OPENCODECMD_DIR}`)
  }
  if (counts.walnut > 0) {
    console.log(`  > ${counts.walnut} walnut commands installed to ${CLAUDE_DIR} and ${OPENCODECMD_DIR}`)
  }
  console.log(`  > Server running at ${url}`)
  console.log('')
  console.log('  +-----------------------------------------------------+')
  console.log('  |                                                      |')
  console.log('  |  To create your first brain:                         |')
  console.log('  |                                                      |')
  console.log('  |  1. Open a new terminal                              |')
  console.log('  |  2. Create a project folder:                         |')
  console.log('  |     mkdir -p ~/brains/my-project                     |')
  console.log('  |  3. Start Claude Code there:                         |')
  console.log('  |     cd ~/brains/my-project && claude                 |')
  console.log('  |  4. Run the init command:                            |')
  console.log('  |     /init-braintree                                  |')
  console.log('  |                                                      |')
  console.log('  |  Your brain will appear at the URL above.            |')
  console.log('  +-----------------------------------------------------+')
  console.log('')
  console.log('  Press Ctrl+C to stop the server.')
  console.log('')
}

function showHelp() {
  console.log(`
  brain-tree-os v${VERSION} - Open source brain viewer

  Usage:
    brain-tree-os              Start the server and open browser
    brain-tree-os status       Show registered brains
    brain-tree-os help         Show this help

  Options:
    --port <number>   Custom port (default: 3000)
    --no-open         Don't auto-open browser
`)
}

function showStatus() {
  const configFile = path.join(CONFIG_DIR, 'brains.json')
  if (!fs.existsSync(configFile)) {
    console.log('  No brains registered yet.')
    console.log('  Run /init-braintree in Claude Code to create your first brain.')
    return
  }
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  const brains = config.brains || []
  if (brains.length === 0) {
    console.log('  No brains registered yet.')
    console.log('  Run /init-braintree in Claude Code to create your first brain.')
    return
  }
  console.log(`  Registered brains (${brains.length}):`)
  for (const brain of brains) {
    console.log(`    ${brain.name} -> ${brain.path}`)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args[0] === 'find-brain') { findBrain(args.includes('--here')); return }
  if (args[0] === 'uuid') { console.log(crypto.randomUUID()); return }
  if (args[0] === 'now') { console.log(formatNow(args.includes('--short'))); return }
  if (args[0] === 'home') { console.log(os.homedir()); return }
  if (args[0] === 'registry-set') { registrySet(args[1], args[2], args[3]); return }
  if (args[0] === 'recover-braintree') { recoverBrain(args[1]); return }
  if (args[0] === 'resume-context') { resumeContext(args[1] || process.cwd()); return }
  if (args[0] === 'status-data') { statusData(args[1] || process.cwd()); return }
  if (args[0] === 'sync-audit') { syncAudit(args[1] || process.cwd()); return }
  if (args[0] === 'next-handoff-number') { nextHandoffNumber(args[1] || process.cwd()); return }
  if (args[0] === 'init-scaffold') { initScaffold(args[1], args[2], args[3], args.slice(4)); return }

  if (args.includes('help') || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  if (args.includes('status')) {
    showStatus()
    return
  }

  const noOpen = args.includes('--no-open')
  const portIdx = args.indexOf('--port')
  const preferredPort = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3000

  // Step 1: Ensure config
  ensureConfigDir()

  // Step 2: Install commands
  const counts = await installCommands()

  // Step 3: Find port
  const port = await findFreePort(preferredPort)

  // Step 4: Save server config (so init-braintree can discover the port)
  saveServerConfig(port)

  // Step 5: Start the web server
  const webDir = path.join(__dirname, '..', '..', 'web')
  const serverScript = path.join(webDir, 'src', 'server', 'custom-server.ts')

  const isBuilt = fs.existsSync(path.join(webDir, '.next'))

  let child: ReturnType<typeof spawn>

  if (isBuilt) {
    const serverDist = path.join(webDir, 'dist', 'server', 'custom-server.js')
    if (fs.existsSync(serverDist)) {
      child = spawn('node', [serverDist], {
        env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
        stdio: 'inherit',
        cwd: webDir,
      })
    } else {
      child = spawn('npx', ['next', 'start', '-p', String(port)], {
        env: { ...process.env, PORT: String(port) },
        stdio: 'inherit',
        cwd: webDir,
      })
    }
  } else {
    child = spawn('npx', ['tsx', serverScript], {
      env: { ...process.env, PORT: String(port), NODE_ENV: 'development' },
      stdio: 'inherit',
      cwd: webDir,
    })
  }

  child.on('error', (err) => {
    cleanupServerConfig()
    console.error('Failed to start server:', err.message)
    process.exit(1)
  })

  // Wait for server to start, then show welcome and open browser
  setTimeout(() => {
    showWelcome(port, counts)
    if (!noOpen) openBrowser(`http://localhost:${port}/brains`)
  }, 2000)

  // Forward signals to child and clean up
  const cleanup = () => {
    cleanupServerConfig()
    child.kill('SIGINT')
    setTimeout(() => process.exit(0), 1000)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  child.on('exit', (code) => {
    cleanupServerConfig()
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  cleanupServerConfig()
  console.error(err)
  process.exit(1)
})
