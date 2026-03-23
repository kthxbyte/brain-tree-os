'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types (same interface as cloud version for UI compatibility)
// ---------------------------------------------------------------------------

export interface ToolUse {
  toolUseId: string;
  tool: string;
  input: unknown;
  result?: unknown;
  isError?: boolean;
  status: 'running' | 'done' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolUses: ToolUse[];
  timestamp: number;
}

export type AgentStatus = 'checking' | 'online' | 'offline';

export interface UseBrainChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  agentStatus: AgentStatus;
  activeFiles: Set<string>;
  sendMessage: (text: string) => void;
  startCommand: (command: string) => void;
  cancelMessage: () => void;
  clearChat: () => void;
}

// ---------------------------------------------------------------------------
// Hook (WebSocket-based for local open source version)
// ---------------------------------------------------------------------------

export function useBrainChat(brainId: string): UseBrainChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('checking');
  const [activeFiles] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);
  const currentAssistantIdRef = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // Connect to local WebSocket server
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to brain and request agent status
      ws.send(JSON.stringify({ type: 'subscribe', brainId }));
      ws.send(JSON.stringify({ type: 'chat-status' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerEvent(msg);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setAgentStatus('offline');
    };

    ws.onerror = () => {
      setAgentStatus('offline');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [brainId]);

  // ---------------------------------------------------------------------------
  // Handle events from server
  // ---------------------------------------------------------------------------

  function handleServerEvent(event: Record<string, unknown>) {
    const type = event.type as string;

    switch (type) {
      case 'agent-status': {
        const status = event.status as string;
        setAgentStatus(status === 'online' ? 'online' : 'offline');
        break;
      }

      case 'chat-text': {
        const id = currentAssistantIdRef.current;
        if (!id) break;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, text: m.text + (event.text as string) } : m
          )
        );
        break;
      }

      case 'chat-tool-use': {
        const id = currentAssistantIdRef.current;
        if (!id) break;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  toolUses: [
                    ...m.toolUses,
                    {
                      toolUseId: event.toolUseId as string,
                      tool: event.tool as string,
                      input: event.input,
                      status: 'running' as const,
                    },
                  ],
                }
              : m
          )
        );
        break;
      }

      case 'chat-tool-result': {
        const id = currentAssistantIdRef.current;
        if (!id) break;
        const toolUseId = event.toolUseId as string;
        const isError = event.isError as boolean | undefined;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  toolUses: m.toolUses.map((t) =>
                    t.toolUseId === toolUseId
                      ? {
                          ...t,
                          result: event.content ?? event.result,
                          isError: isError ?? false,
                          status: isError ? ('error' as const) : ('done' as const),
                        }
                      : t
                  ),
                }
              : m
          )
        );
        break;
      }

      case 'chat-error':
        setError(event.error as string);
        setIsStreaming(false);
        currentAssistantIdRef.current = null;
        break;

      case 'chat-done':
        setIsStreaming(false);
        currentAssistantIdRef.current = null;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Send message via WebSocket
  // ---------------------------------------------------------------------------

  const doChat = useCallback(
    (message: string, command?: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || agentStatus !== 'online') {
        setError('Claude Code is not available. Make sure the CLI is installed.');
        return;
      }

      setError(null);
      setIsStreaming(true);

      // Add user message
      const commandLabels: Record<string, string> = {
        init: 'Initialize brain',
        resume: 'Resume session',
        'wrap-up': 'Wrap up session',
        plan: 'Plan next step',
        sprint: 'Plan sprint',
        status: 'Check status',
      };

      const displayText = command ? (commandLabels[command] ?? command) : message;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: displayText,
        toolUses: [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Create assistant message placeholder
      const assistantId = `assistant-${Date.now()}`;
      currentAssistantIdRef.current = assistantId;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          text: '',
          toolUses: [],
          timestamp: Date.now(),
        },
      ]);

      // Send to server
      ws.send(
        JSON.stringify({
          type: 'chat-request',
          brainId,
          message: message || undefined,
          command: command || undefined,
          requestId: assistantId,
        })
      );
    },
    [brainId, agentStatus]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming) return;
      doChat(text.trim());
    },
    [doChat, isStreaming]
  );

  const startCommand = useCallback(
    (command: string) => {
      if (isStreaming) return;
      doChat('', command);
    },
    [doChat, isStreaming]
  );

  const cancelMessage = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'chat-cancel',
          brainId,
        })
      );
    }
    setIsStreaming(false);
    currentAssistantIdRef.current = null;
  }, [brainId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    agentStatus,
    activeFiles,
    sendMessage,
    startCommand,
    cancelMessage,
    clearChat,
  };
}
