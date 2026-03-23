'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Leaf, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onCancel: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onCancel, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !isStreaming && !disabled) {
        onSend(text.trim());
        setText('');
      }
    }
  }

  function handleSendClick() {
    if (isStreaming) {
      onCancel();
    } else if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border px-3 py-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          disabled
            ? 'Claude Code not available'
            : isStreaming
              ? 'Claude is thinking...'
              : 'Ask Claude anything...'
        }
        disabled={disabled || isStreaming}
        rows={1}
        className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-text placeholder:text-text-muted focus:outline-none disabled:opacity-50"
        style={{ maxHeight: 120 }}
      />
      <button
        onClick={handleSendClick}
        disabled={disabled || (!isStreaming && !text.trim())}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-30"
        style={{
          backgroundColor: isStreaming ? '#D95B5B' : '#5B9A65',
        }}
        title={isStreaming ? 'Stop' : 'Send'}
      >
        {isStreaming ? (
          <Square className="h-3 w-3 text-white" fill="white" />
        ) : (
          <Leaf className="h-3 w-3 text-white" />
        )}
      </button>
    </div>
  );
}
