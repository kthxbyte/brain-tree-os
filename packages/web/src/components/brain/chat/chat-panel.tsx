'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type PointerEvent,
} from 'react';
import {
  Leaf,
  Minus,
  X,
  Play,
  Package,
  Map,
  Calendar,
  BarChart3,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import type { UseBrainChatReturn } from '@/hooks/use-brain-chat';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 520;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 300;

const STORAGE_KEY = 'braintree-chat-panel';

interface PanelState {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadPosition(): PanelState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePosition(state: PanelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Command toolbar items
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  icon: typeof Play;
}

const COMMANDS: CommandItem[] = [
  { id: 'resume', label: 'Resume', icon: Play },
  { id: 'wrap-up', label: 'Wrap up', icon: Package },
  { id: 'plan', label: 'Plan', icon: Map },
  { id: 'sprint', label: 'Sprint', icon: Calendar },
  { id: 'status', label: 'Status', icon: BarChart3 },
];

// ---------------------------------------------------------------------------
// Chat Panel
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  chat: UseBrainChatReturn;
  brainId: string;
  onClose: () => void;
}

export function ChatPanel({ chat, brainId, onClose }: ChatPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<PanelState>(() => {
    const saved = loadPosition();
    if (saved) return saved;
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - DEFAULT_WIDTH - 16 : 100,
      y: typeof window !== 'undefined' ? window.innerHeight - DEFAULT_HEIGHT - 16 : 100,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    };
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Resize state
  const resizeRef = useRef<{
    edge: string;
    startX: number;
    startY: number;
    startPos: PanelState;
  } | null>(null);

  // Save position on change
  useEffect(() => {
    savePosition(pos);
  }, [pos]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  // ---- Drag handlers ----

  const onDragStart = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: pos.x,
        startPosY: pos.y,
      };
    },
    [pos.x, pos.y]
  );

  const onDragMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos((prev) => ({
      ...prev,
      x: dragRef.current!.startPosX + dx,
      y: dragRef.current!.startPosY + dy,
    }));
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  // ---- Resize handlers ----

  const onResizeStart = useCallback(
    (edge: string) => (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...pos },
      };
    },
    [pos]
  );

  const onResizeMove = useCallback((e: PointerEvent) => {
    if (!resizeRef.current) return;
    const { edge, startX, startY, startPos } = resizeRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    setPos((prev) => {
      const next = { ...prev };

      if (edge.includes('e')) {
        next.width = Math.max(MIN_WIDTH, startPos.width + dx);
      }
      if (edge.includes('w')) {
        const newWidth = Math.max(MIN_WIDTH, startPos.width - dx);
        next.x = startPos.x + (startPos.width - newWidth);
        next.width = newWidth;
      }
      if (edge.includes('s')) {
        next.height = Math.max(MIN_HEIGHT, startPos.height + dy);
      }
      if (edge.includes('n')) {
        const newHeight = Math.max(MIN_HEIGHT, startPos.height - dy);
        next.y = startPos.y + (startPos.height - newHeight);
        next.height = newHeight;
      }

      return next;
    });
  }, []);

  const onResizeEnd = useCallback(() => {
    resizeRef.current = null;
  }, []);

  // ---- Minimized bar ----

  if (minimized) {
    return (
      <div
        className="fixed z-50 flex items-center gap-2 border border-border bg-bg/95 px-3 py-1.5 shadow-lg backdrop-blur-sm"
        style={{ left: pos.x, top: pos.y + pos.height - 36 }}
      >
        <div className="relative">
          <Leaf className="h-3.5 w-3.5" style={{ color: '#5B9A65' }} />
          <span
            className="absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: chat.agentStatus === 'online' ? '#5B9A65' : '#D95B5B',
            }}
          />
        </div>
        <span className="text-[12px] font-medium text-text-secondary">
          Brain Chat
        </span>
        {chat.isStreaming && (
          <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#5B9A65' }} />
        )}
        <button
          onClick={() => setMinimized(false)}
          className="ml-2 rounded p-0.5 text-text-muted transition-colors hover:bg-text/5 hover:text-text-secondary"
        >
          <Minus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // ---- Full panel ----

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col border border-border bg-bg/95 shadow-xl backdrop-blur-sm"
      style={{
        left: pos.x,
        top: pos.y,
        width: pos.width,
        height: pos.height,
      }}
    >
      {/* Resize edges */}
      {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((edge) => (
        <div
          key={edge}
          onPointerDown={onResizeStart(edge)}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          className="absolute z-10"
          style={{
            cursor: `${edge}-resize`,
            ...(edge === 'n' && {
              top: -2,
              left: 8,
              right: 8,
              height: 4,
            }),
            ...(edge === 's' && {
              bottom: -2,
              left: 8,
              right: 8,
              height: 4,
            }),
            ...(edge === 'e' && {
              right: -2,
              top: 8,
              bottom: 8,
              width: 4,
            }),
            ...(edge === 'w' && {
              left: -2,
              top: 8,
              bottom: 8,
              width: 4,
            }),
            ...(edge === 'ne' && {
              top: -2,
              right: -2,
              width: 10,
              height: 10,
            }),
            ...(edge === 'nw' && {
              top: -2,
              left: -2,
              width: 10,
              height: 10,
            }),
            ...(edge === 'se' && {
              bottom: -2,
              right: -2,
              width: 10,
              height: 10,
            }),
            ...(edge === 'sw' && {
              bottom: -2,
              left: -2,
              width: 10,
              height: 10,
            }),
          }}
        />
      ))}

      {/* Title bar (draggable) */}
      <div
        className="flex shrink-0 cursor-grab items-center gap-2 border-b border-border px-3 py-2 select-none active:cursor-grabbing"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        <div className="relative">
          <Leaf className="h-3.5 w-3.5" style={{ color: '#5B9A65' }} />
          <span
            className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-bg"
            style={{
              backgroundColor:
                chat.agentStatus === 'online'
                  ? '#5B9A65'
                  : chat.agentStatus === 'checking'
                    ? '#E8A830'
                    : '#D95B5B',
            }}
          />
        </div>
        <span className="text-[12px] font-semibold tracking-tight text-text-secondary">
          Brain Chat
        </span>

        {/* Command toolbar */}
        <div className="ml-auto flex items-center gap-0.5">
          {COMMANDS.map(({ id, label, icon: CmdIcon }) => (
            <button
              key={id}
              onClick={() => chat.startCommand(id)}
              disabled={chat.isStreaming}
              className="rounded p-1 text-text-muted transition-colors hover:bg-text/5 hover:text-text-secondary disabled:opacity-30"
              title={label}
            >
              <CmdIcon className="h-3.5 w-3.5" />
            </button>
          ))}

          <div className="mx-1.5 h-3 w-px bg-border" />

          <button
            onClick={() => setMinimized(true)}
            className="rounded p-1 text-text-muted transition-colors hover:bg-text/5 hover:text-text-secondary"
            title="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:bg-text/5 hover:text-text-secondary"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {/* Agent checking: show loading */}
        {chat.agentStatus === 'checking' && chat.messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5B9A65' }} />
            <p className="text-[12px] text-text-muted">
              Looking for Claude Code...
            </p>
          </div>
        )}

        {/* Agent offline */}
        {chat.agentStatus === 'offline' && chat.messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <WifiOff className="h-6 w-6 text-text-muted" />
            <p className="text-[13px] font-medium text-text-secondary">
              Claude Code Not Found
            </p>
            <p className="text-[12px] text-text-muted">
              Make sure Claude Code CLI is installed and available in your PATH.
            </p>
          </div>
        )}

        {/* Agent online, no messages: show welcome */}
        {chat.agentStatus === 'online' && chat.messages.length === 0 && !chat.error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(91, 154, 101, 0.1)' }}
            >
              <Leaf className="h-5 w-5" style={{ color: '#5B9A65' }} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-secondary">
                Claude Code Connected
              </p>
              <p className="mt-0.5 text-[12px] text-text-muted">
                Chat with Claude Code to build and manage your brain.
                Use the toolbar icons to run commands.
              </p>
            </div>
          </div>
        )}

        {chat.messages.map((msg, idx) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isStreaming={chat.isStreaming}
            isLast={idx === chat.messages.length - 1}
          />
        ))}

        {chat.error && (
          <div className="mx-3 my-2 border border-[#D95B5B]/20 bg-[#D95B5B]/[0.05] px-3 py-2 text-[12px] text-[#D95B5B]">
            {chat.error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Agent status bar */}
      {chat.agentStatus !== 'online' && chat.messages.length > 0 && (
        <div className="flex items-center gap-2 border-t border-[#E8A830]/20 bg-[#E8A830]/[0.05] px-3 py-1.5">
          <WifiOff className="h-3 w-3 text-[#E8A830]" />
          <span className="text-[11px] text-[#E8A830]">
            Claude Code disconnected.
          </span>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={chat.sendMessage}
        onCancel={chat.cancelMessage}
        isStreaming={chat.isStreaming}
        disabled={chat.agentStatus !== 'online'}
      />
    </div>
  );
}
