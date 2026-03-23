import { useAtomValue, useSetAtom } from 'jotai';
import type { SearchAnswerBlock, SearchCitation, SearchSource } from '@opensearch/contracts';
import { ExternalLink, SearchCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  activeThreadAtom,
  activeTurnAtom,
  highlightedSourceIdAtom,
  isStreamingAtom,
  setHighlightedSourceAtom,
  sourceCitationsAtom,
  visibleCitationsAtom,
} from '@/lib/atoms/search';
import { cn } from '@/lib/utils';

export function AnswerSurface() {
  const activeThread = useAtomValue(activeThreadAtom);
  const activeTurn = useAtomValue(activeTurnAtom);
  const highlightedSourceId = useAtomValue(highlightedSourceIdAtom);
  const isStreaming = useAtomValue(isStreamingAtom);
  const sources = useAtomValue(sourceCitationsAtom);
  const citations = useAtomValue(visibleCitationsAtom);
  const highlightSource = useSetAtom(setHighlightedSourceAtom);

  if (!activeThread || !activeTurn) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
        <div className="max-w-3xl progressive-reveal" style={{ ['--reveal-delay' as string]: '90ms' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--muted-foreground)]">Dark mode by default</p>
          <p className="mt-4 font-serif text-4xl tracking-[-0.05em] text-white sm:text-6xl">A quieter interface for evidence-heavy assistant search.</p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
            Search private context, code, and web sources without visual noise. Reveal citations only when you need them. Keep follow-ups close.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 text-left">
            {['Minimal composer', 'Progressive reveal', 'Visible datasource policy'].map((item, index) => (
              <Badge className="progressive-reveal px-3 py-1.5" key={item} style={{ ['--reveal-delay' as string]: `${160 + index * 70}ms` }} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-3 progressive-reveal" style={{ ['--reveal-delay' as string]: '80ms' }}>
          <Badge variant="secondary">{isStreaming ? 'Streaming' : activeTurn.status}</Badge>
          <h2 className="font-serif text-3xl tracking-[-0.04em] text-white sm:text-5xl">{activeTurn.query}</h2>
        </div>

        <div className="space-y-4">
          {renderAnswerSections(activeTurn.answerBlocks, activeTurn.answerText).map((section, index) => (
            <article className="progressive-reveal space-y-3" key={section.id} style={{ ['--reveal-delay' as string]: `${140 + index * 80}ms` }}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">{section.label}</div>
              {section.block.type === 'text' ? (
                <p className="max-w-3xl text-[15px] leading-8 text-[var(--card-foreground)] sm:text-lg">{section.block.text}</p>
              ) : (
                <ul className="max-w-3xl space-y-3 text-[15px] leading-7 text-[var(--card-foreground)] sm:text-base">
                  {section.block.items.map((item: string) => (
                    <li className="surface-border rounded-[1.2rem] bg-[rgba(255,255,255,0.03)] px-4 py-3" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}

          {citations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {citations.map((citation: SearchCitation, citationIndex: number) => {
                const source = sources.find((entry: SearchSource) => entry.id === citation.sourceId);
                if (!source) {
                  return null;
                }

                return (
                  <button
                    className={cn(
                      'surface-border inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs transition hover:bg-[rgba(255,255,255,0.08)]',
                      highlightedSourceId === source.id && 'bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] text-white',
                    )}
                    key={`${citation.sourceId}-${citationIndex}`}
                    onBlur={() => highlightSource(null)}
                    onFocus={() => highlightSource(source.id)}
                    onMouseEnter={() => highlightSource(source.id)}
                    onMouseLeave={() => highlightSource(null)}
                    type="button"
                  >
                    <SearchCheck className="size-3.5" />
                    [{citationIndex + 1}] {citation.title}
                  </button>
                );
              })}
            </div>
          ) : null}

          {isStreaming ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[84%]" />
            </div>
          ) : null}
        </div>

        <div className="surface-border progressive-reveal rounded-[1.6rem] bg-[rgba(255,255,255,0.03)] p-4" style={{ ['--reveal-delay' as string]: '240ms' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Evidence posture
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Keep datasource scope visible while pressure-testing what your assistant can trust.
              </p>
            </div>
            {sources[0]?.url ? (
              <Button onClick={() => window.open(sources[0].url, '_blank', 'noopener,noreferrer')} size="sm" variant="outline">
                <ExternalLink className="size-4" />
                Open top source
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function renderAnswerSections(answerBlocks: SearchAnswerBlock[], answerText: string) {
  if (answerBlocks.length > 0) {
    return answerBlocks.map((block, index) => ({
      id: `block-${index}`,
      label: block.label ?? defaultBlockLabel(block, index),
      block,
    }));
  }

  if (!answerText.trim()) {
    return [];
  }

  return [{ id: 'streaming-answer', label: 'Answer', block: { type: 'text', text: answerText } as SearchAnswerBlock }];
}

function defaultBlockLabel(block: SearchAnswerBlock, index: number) {
  if (block.type === 'list') {
    return 'Evidence';
  }

  return index === 0 ? 'Answer' : 'Notes';
}
