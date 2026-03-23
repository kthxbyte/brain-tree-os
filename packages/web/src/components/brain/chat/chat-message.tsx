'use client';

import { Leaf, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/hooks/use-brain-chat';
import { ChatToolCard } from './chat-tool-card';

// ---------------------------------------------------------------------------
// Thinking indicator (3-dot pulse)
// ---------------------------------------------------------------------------

function ThinkingDots() {
  return (
    <div className="mt-1 flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: '#5B9A65',
            opacity: 0.4,
            animation: `braintree-dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes braintree-dot-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 0.8; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat message
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  isLast?: boolean;
}

export function ChatMessage({ message, isStreaming, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const showThinking =
    !isUser &&
    isStreaming &&
    isLast &&
    !message.text &&
    message.toolUses.length === 0;

  return (
    <div className="flex gap-2.5 px-3 py-2.5">
      {/* Avatar */}
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: isUser
            ? 'rgba(43, 42, 37, 0.08)'
            : 'rgba(91, 154, 101, 0.12)',
        }}
      >
        {isUser ? (
          <User className="h-3 w-3" style={{ color: 'rgba(43, 42, 37, 0.5)' }} />
        ) : (
          <Leaf className="h-3 w-3" style={{ color: '#5B9A65' }} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <span
          className="text-[11px] font-semibold"
          style={{
            color: isUser ? 'rgba(43, 42, 37, 0.5)' : '#5B9A65',
          }}
        >
          {isUser ? 'You' : 'Claude'}
        </span>

        {showThinking && <ThinkingDots />}

        {message.text && (
          <div className="mt-0.5 text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
            {message.text}
          </div>
        )}

        {message.toolUses.length > 0 && (
          <div className="mt-1">
            {message.toolUses.map((tool) => (
              <ChatToolCard key={tool.toolUseId} toolUse={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
