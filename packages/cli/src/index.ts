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

function findBrain() {
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

async function installCommands(): Promise<{ claude: number; opencode: number }> {
  let claudeCount = 0
  let opencodeCount = 0

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

  return { claude: claudeCount, opencode: opencodeCount }
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

function showWelcome(port: number, counts: { claude: number; opencode: number }) {
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

  if (args[0] === 'find-brain') { findBrain(); return }
  if (args[0] === 'uuid') { console.log(crypto.randomUUID()); return }
  if (args[0] === 'now') { console.log(formatNow(args.includes('--short'))); return }
  if (args[0] === 'home') { console.log(os.homedir()); return }
  if (args[0] === 'registry-set') { registrySet(args[1], args[2], args[3]); return }
  if (args[0] === 'recover-braintree') { recoverBrain(args[1]); return }

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
