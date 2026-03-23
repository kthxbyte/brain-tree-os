'use client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type BrainStatus = 'building' | 'live' | 'error';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  brainStatus?: BrainStatus;
  isStreaming?: boolean;
  fileCount?: number;
}

export function ConnectionStatusIndicator({
  status,
  brainStatus,
  isStreaming = false,
  fileCount,
}: ConnectionStatusIndicatorProps) {
  // Don't show anything when disconnected
  if (status === 'disconnected') return null;

  // Brain is being built by init-braintree
  if (brainStatus === 'building') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: '#E8A830' }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: '#E8A830' }}
          />
        </span>
        <span className="text-[10px] font-medium text-text-muted">
          Building{fileCount != null ? `\u2002\u00B7\u2002${fileCount} files` : '...'}
        </span>
      </div>
    );
  }

  // Streaming file changes (but brain is live)
  if (isStreaming) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: '#5B9A65' }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: '#5B9A65' }}
          />
        </span>
        <span className="text-[10px] font-medium text-text-muted">
          Syncing{fileCount != null ? `\u2002\u00B7\u2002${fileCount} files` : '...'}
        </span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: '#E8A830' }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: '#E8A830' }}
          />
        </span>
        <span className="text-[10px] font-medium text-text-muted">Connecting...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#D95B5B' }} />
        <span className="text-[10px] font-medium text-text-muted">Disconnected</span>
      </div>
    );
  }

  // Connected / Live
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-bg/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#5B9A65' }} />
      <span className="text-[10px] font-medium text-text-muted">Live</span>
    </div>
  );
}
