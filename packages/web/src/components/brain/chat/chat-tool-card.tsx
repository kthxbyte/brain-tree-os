'use client';

import { useState } from 'react';
import {
  Terminal,
  FileText,
  Search,
  Pencil,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ToolUse } from '@/hooks/use-brain-chat';

const TOOL_ICONS: Record<string, typeof Terminal> = {
  Bash: Terminal,
  Read: FileText,
  Grep: Search,
  Glob: Search,
  Edit: Pencil,
  Write: Pencil,
};

const STATUS_COLORS: Record<string, string> = {
  running: '#E8A830',
  done: '#5B9A65',
  error: '#D95B5B',
};

function formatInput(input: unknown): string {
  if (!input) return '';
  if (typeof input === 'string') return input;
  try {
    const obj = input as Record<string, unknown>;
    // Show most relevant field for common tools
    if (obj.command) return String(obj.command);
    if (obj.file_path) return String(obj.file_path);
    if (obj.pattern) return String(obj.pattern);
    if (obj.path) return String(obj.path);
    return JSON.stringify(input, null, 2);
  } catch {
    return String(input);
  }
}

function formatResult(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === 'string') return c;
        if (c && typeof c === 'object' && 'text' in c) return c.text;
        return JSON.stringify(c);
      })
      .join('\n');
  }
  return JSON.stringify(content, null, 2);
}

export function ChatToolCard({ toolUse }: { toolUse: ToolUse }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[toolUse.tool] ?? Terminal;
  const statusColor = STATUS_COLORS[toolUse.status] ?? STATUS_COLORS.running;
  const inputPreview = formatInput(toolUse.input);
  const resultText = formatResult(toolUse.result);

  return (
    <div className="my-1.5 border border-border bg-text/[0.02]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-text/[0.03]"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <span className="text-[12px] font-medium text-text-secondary">
          {toolUse.tool}
        </span>
        {inputPreview && (
          <span className="truncate text-[11px] font-mono text-text-muted">
            {inputPreview.slice(0, 60)}
            {inputPreview.length > 60 ? '...' : ''}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-text-muted" />
          ) : (
            <ChevronRight className="h-3 w-3 text-text-muted" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-2.5 py-2 text-[11px] font-mono">
          {inputPreview && (
            <div className="mb-2">
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-text-muted">
                Input
              </span>
              <pre className="mt-0.5 max-h-[120px] overflow-auto whitespace-pre-wrap break-all text-text-secondary">
                {inputPreview}
              </pre>
            </div>
          )}
          {resultText && (
            <div>
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-text-muted">
                Result
              </span>
              <pre
                className="mt-0.5 max-h-[200px] overflow-auto whitespace-pre-wrap break-all"
                style={{
                  color: toolUse.isError
                    ? '#D95B5B'
                    : 'rgba(43, 42, 37, 0.62)',
                }}
              >
                {resultText}
              </pre>
            </div>
          )}
          {toolUse.status === 'running' && !resultText && (
            <span className="text-text-muted">Running...</span>
          )}
        </div>
      )}
    </div>
  );
}
