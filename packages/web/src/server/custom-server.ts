import path from 'path'
import next from 'next'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'
import { spawn, ChildProcess, execSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import { startWatcher } from './watcher'
import { addGlobalListener } from './global-watcher'
import { getBrain } from '../lib/local-data'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

// __dirname is packages/web/src/server, project root is two levels up
const projectRoot = path.resolve(__dirname, '..', '..')
const app = next({ dev, dir: projectRoot })
const handle = app.getRequestHandler()

// Track watchers per WebSocket connection
const clientWatchers = new Map<WebSocket, { brainId: string; close: () => void }>()
// Track global subscribers (for brains list auto-refresh)
const globalSubscribers = new Set<WebSocket>()
const globalCleanups = new Map<WebSocket, () => void>()

// ── Chat: Claude binary detection ───────────────────
let claudeBinaryPath: string | null = null

function findClaudeBinary(): string | null {
  // Check common locations
  const candidates = [
    '/opt/homebrew/bin/claude',
    '/usr/local/bin/claude',
    path.join(os.homedir(), '.nvm/versions/node', '**', 'bin/claude'),
  ]

  // Try which/where first
  try {
    const found = execSync('which claude', { encoding: 'utf8', timeout: 5000 }).trim()
    if (found && fs.existsSync(found)) return found
  } catch {
    // not in PATH
  }

  // Check NVM paths
  const nvmDir = path.join(os.homedir(), '.nvm', 'versions', 'node')
  if (fs.existsSync(nvmDir)) {
    try {
      const versions = fs.readdirSync(nvmDir)
      for (const v of versions) {
        const bin = path.join(nvmDir, v, 'bin', 'claude')
        if (fs.existsSync(bin)) return bin
      }
    } catch {
      // ignore
    }
  }

  // Check static candidates
  for (const c of candidates) {
    if (!c.includes('**') && fs.existsSync(c)) return c
  }

  return null
}

// ── Chat: process tracking ──────────────────────────
const activeChats = new Map<WebSocket, ChildProcess>()

// ── Chat: translate Claude stream-json events to WebSocket messages ──
function handleClaudeEvent(ws: WebSocket, event: Record<string, unknown>, requestId: string) {
  if (ws.readyState !== WebSocket.OPEN) return

  const type = event.type as string

  if (type === 'assistant' && event.message) {
    // Assistant message with content blocks
    const message = event.message as Record<string, unknown>
    const content = message.content as Array<Record<string, unknown>> | undefined
    if (content) {
      for (const block of content) {
        if (block.type === 'text') {
          ws.send(JSON.stringify({ type: 'chat-text', text: block.text, requestId }))
        } else if (block.type === 'tool_use') {
          ws.send(JSON.stringify({
            type: 'chat-tool-use',
            toolUseId: block.id,
            tool: block.name,
            input: block.input,
            requestId,
          }))
        }
      }
    }
  } else if (type === 'content_block_delta') {
    const delta = event.delta as Record<string, unknown> | undefined
    if (delta?.type === 'text_delta' && delta.text) {
      ws.send(JSON.stringify({ type: 'chat-text', text: delta.text, requestId }))
    }
  } else if (type === 'result') {
    // Final result object
    const result = event.result as string | undefined
    if (result) {
      ws.send(JSON.stringify({ type: 'chat-text', text: result, requestId }))
    }
  } else if (type === 'tool_result' || type === 'tool_use_result') {
    ws.send(JSON.stringify({
      type: 'chat-tool-result',
      toolUseId: event.tool_use_id ?? event.id,
      result: event.output ?? event.content ?? '',
      isError: event.is_error ?? false,
      requestId,
    }))
  }
}

// Detect Claude binary at startup
claudeBinaryPath = findClaudeBinary()
if (claudeBinaryPath) {
  console.log(`> Claude Code CLI found at: ${claudeBinaryPath}`)
} else {
  console.log('> Claude Code CLI not found. Brain Chat will be unavailable.')
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '/', true)
    handle(req, res, parsedUrl)
  })

  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())

        if (msg.type === 'subscribe' && msg.brainId) {
          // Clean up existing watcher for this client
          const existing = clientWatchers.get(ws)
          if (existing) existing.close()

          const watcher = startWatcher(msg.brainId, ws)
          clientWatchers.set(ws, { brainId: msg.brainId, close: watcher.close })
        }

        if (msg.type === 'subscribe-global') {
          // Subscribe to global brains.json changes
          const cleanup = addGlobalListener(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'brains-updated' }))
            }
          })
          globalSubscribers.add(ws)
          globalCleanups.set(ws, cleanup)
        }

        // ── Chat: status check ──────────────────────
        if (msg.type === 'chat-status') {
          const status = claudeBinaryPath ? 'online' : 'offline'
          ws.send(JSON.stringify({ type: 'agent-status', status }))
        }

        // ── Chat: send message to Claude ────────────
        if (msg.type === 'chat-request' && msg.message && msg.brainId) {
          if (!claudeBinaryPath) {
            ws.send(JSON.stringify({ type: 'chat-error', error: 'Claude Code CLI not found. Install it first.', requestId: msg.requestId }))
            return
          }

          // Kill any existing chat process for this connection
          const existing = activeChats.get(ws)
          if (existing) {
            existing.kill('SIGTERM')
            activeChats.delete(ws)
          }

          // Resolve brain path for cwd
          const brain = getBrain(msg.brainId)
          const cwd = brain?.path || process.cwd()

          // Build the prompt (may include command prefix)
          const prompt = msg.command
            ? `${msg.command} ${msg.message}`.trim()
            : msg.message

          // Spawn Claude CLI
          const env = { ...process.env }
          // Unset CLAUDECODE to avoid nested agent issues
          delete env.CLAUDECODE

          const child = spawn(claudeBinaryPath, [
            '-p', prompt,
            '--output-format', 'stream-json',
          ], {
            cwd,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
          })

          activeChats.set(ws, child)

          let buffer = ''

          child.stdout?.on('data', (chunk: Buffer) => {
            buffer += chunk.toString()
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.trim()) continue
              try {
                const event = JSON.parse(line)
                handleClaudeEvent(ws, event, msg.requestId)
              } catch {
                // Skip non-JSON lines
              }
            }
          })

          child.stderr?.on('data', (chunk: Buffer) => {
            const text = chunk.toString()
            // Only forward actual errors, not debug output
            if (text.includes('Error') || text.includes('error')) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'chat-error', error: text.trim(), requestId: msg.requestId }))
              }
            }
          })

          child.on('close', () => {
            // Process remaining buffer
            if (buffer.trim()) {
              try {
                const event = JSON.parse(buffer)
                handleClaudeEvent(ws, event, msg.requestId)
              } catch {
                // ignore
              }
            }
            activeChats.delete(ws)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'chat-done', requestId: msg.requestId }))
            }
          })

          child.on('error', (err) => {
            activeChats.delete(ws)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'chat-error', error: err.message, requestId: msg.requestId }))
              ws.send(JSON.stringify({ type: 'chat-done', requestId: msg.requestId }))
            }
          })
        }

        // ── Chat: cancel ────────────────────────────
        if (msg.type === 'chat-cancel') {
          const child = activeChats.get(ws)
          if (child) {
            child.kill('SIGTERM')
            activeChats.delete(ws)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'chat-done', requestId: msg.requestId }))
            }
          }
        }
      } catch {
        // Ignore malformed messages
      }
    })

    ws.on('close', () => {
      // Clean up brain watcher
      const existing = clientWatchers.get(ws)
      if (existing) {
        existing.close()
        clientWatchers.delete(ws)
      }

      // Clean up global subscription
      const globalCleanup = globalCleanups.get(ws)
      if (globalCleanup) {
        globalCleanup()
        globalCleanups.delete(ws)
      }
      globalSubscribers.delete(ws)

      // Clean up active chat process
      const chatProcess = activeChats.get(ws)
      if (chatProcess) {
        chatProcess.kill('SIGTERM')
        activeChats.delete(ws)
      }
    })
  })

  server.listen(port, () => {
    console.log(`> BrainTree OS running at http://localhost:${port}`)
  })

  const shutdown = () => {
    console.log('\n> Shutting down...')
    wss.clients.forEach((client) => client.close())
    clientWatchers.forEach(({ close }) => close())
    globalCleanups.forEach((cleanup) => cleanup())
    activeChats.forEach((child) => child.kill('SIGTERM'))
    activeChats.clear()
    server.close(() => process.exit(0))
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
})
