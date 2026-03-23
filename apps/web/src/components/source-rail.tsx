import { useAtomValue, useSetAtom } from 'jotai';
import { Database, Globe, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  datasourcesAtom,
  highlightedSourceIdAtom,
  selectedDatasourceIdsAtom,
  setHighlightedSourceAtom,
  sourceCitationsAtom,
  sourceRailOpenAtom,
} from '@/lib/atoms/search';
import { cn } from '@/lib/utils';

export function SourceRail() {
  const datasources = useAtomValue(datasourcesAtom);
  const sources = useAtomValue(sourceCitationsAtom);
  const highlightedSourceId = useAtomValue(highlightedSourceIdAtom);
  const selectedDatasourceIds = useAtomValue(selectedDatasourceIdsAtom);
  const sourceRailOpen = useAtomValue(sourceRailOpenAtom);
  const highlightSource = useSetAtom(setHighlightedSourceAtom);

  return (
    <Card className="glass-panel progressive-reveal flex h-full min-h-[calc(100vh-2rem)] flex-col overflow-hidden" style={{ ['--reveal-delay' as string]: '140ms' }}>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Source rail
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">Visible evidence</h2>
          </div>
          <Badge variant={sourceRailOpen ? 'default' : 'outline'}>{sources.length} sources</Badge>
        </div>
        {datasources.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Database className="size-3.5" />
            {selectedDatasourceIds.length} of {datasources.filter((datasource) => datasource.enabled).length} datasources in scope
          </div>
        ) : null}
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-2">
          {sources.length === 0 ? (
            <div className="surface-border rounded-[1.45rem] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
              No sources are visible for the current datasource scope yet.
            </div>
          ) : null}
          {sources.map((source, index) => (
            <a
              className={cn(
                'surface-border progressive-reveal block rounded-[1.45rem] bg-[rgba(255,255,255,0.03)] p-4 transition hover:bg-[rgba(255,255,255,0.06)]',
                highlightedSourceId === source.id && 'bg-[color-mix(in_srgb,var(--accent)_24%,transparent)]',
              )}
              href={source.url}
              key={source.id}
              onBlur={() => highlightSource(null)}
              onFocus={() => highlightSource(source.id)}
              onMouseEnter={() => highlightSource(source.id)}
              onMouseLeave={() => highlightSource(null)}
              style={{ ['--reveal-delay' as string]: `${120 + index * 55}ms` }}
              rel="noreferrer"
              target="_blank"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline">
                  [{index + 1}] {datasources.find((datasource) => datasource.id === source.datasourceId)?.label ?? source.datasourceId}
                </Badge>
                <Globe className="size-4 text-[var(--muted-foreground)]" />
              </div>
              <div className="mt-3 text-sm font-semibold leading-6">{source.title}</div>
              {source.snippet ? (
                source.category === 'code' ? (
                  <pre className="surface-border mt-3 overflow-x-auto rounded-[1rem] bg-[rgba(11,15,18,0.78)] px-3 py-3 font-mono text-[12px] leading-6 whitespace-pre-wrap text-[var(--muted-foreground)]">
                    <code>{source.snippet}</code>
                  </pre>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{source.snippet}</p>
                )
              ) : (
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">No excerpt available.</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <Link2 className="size-3.5" />
                {formatSourceMeta(source.url, source.datasourceId)}
              </div>
            </a>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

function formatSourceMeta(url: string | undefined, fallback: string) {
  if (!url) {
    return fallback;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}
