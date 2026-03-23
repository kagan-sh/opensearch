import { useAtomValue, useSetAtom } from 'jotai';
import { Clock3, MessageSquareText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  activeThreadIdAtom,
  createBlankThreadAtom,
  selectThreadAtom,
  threadsAtom,
} from '@/lib/atoms/search';
import { cn, formatRelativeTime } from '@/lib/utils';

export function ThreadRail() {
  const threads = useAtomValue(threadsAtom);
  const activeThreadId = useAtomValue(activeThreadIdAtom);
  const selectThread = useSetAtom(selectThreadAtom);
  const createBlankThread = useSetAtom(createBlankThreadAtom);

  return (
    <Card className="glass-panel progressive-reveal flex h-full flex-col overflow-hidden" style={{ ['--reveal-delay' as string]: '60ms' }}>
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            Thread history
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">Context rail</h2>
        </div>
        <Button onClick={() => createBlankThread()} size="icon" variant="secondary">
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="px-4 pb-3">
        <Badge variant="outline">{threads.length} live threads</Badge>
      </div>

      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-2">
          {threads.length === 0 ? (
            <div className="surface-border rounded-[1.5rem] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
              No saved threads yet. Start a private search to build assistant context.
            </div>
          ) : null}
          {threads.map((thread) => {
            const active = thread.id === activeThreadId;

            return (
              <button
                className={cn(
                  'surface-border progressive-reveal w-full rounded-[1.5rem] p-3 text-left transition',
                  active
                    ? 'bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] shadow-[0_16px_44px_rgba(42,196,214,0.12)]'
                    : 'bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)]',
                )}
                key={thread.id}
                onClick={() => selectThread(thread.id)}
                style={{ ['--reveal-delay' as string]: `${80 + threads.indexOf(thread) * 40}ms` }}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      <MessageSquareText className="size-3.5" />
                      Thread
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold leading-5">{thread.title}</div>
                  </div>
                  {active ? <Badge>Open</Badge> : null}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <Clock3 className="size-3.5" />
                  {formatRelativeTime(thread.updatedAt)}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
