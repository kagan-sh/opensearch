import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ArrowUp, LoaderCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  composerDraftAtom,
  composerModeAtom,
  datasourcesAtom,
  isStreamingAtom,
  selectedDatasourceIdsAtom,
  submitSearchAtom,
  toggleDatasourceAtom,
} from '@/lib/atoms/search';

export function SearchComposer() {
  const [draft, setDraft] = useAtom(composerDraftAtom);
  const mode = useAtomValue(composerModeAtom);
  const datasources = useAtomValue(datasourcesAtom);
  const selectedDatasourceIds = useAtomValue(selectedDatasourceIdsAtom);
  const isStreaming = useAtomValue(isStreamingAtom);
  const submitSearch = useSetAtom(submitSearchAtom);
  const toggleDatasource = useSetAtom(toggleDatasourceAtom);

  return (
    <div className="space-y-4 bg-[linear-gradient(180deg,rgba(8,11,16,0.92),rgba(10,14,20,0.98))] px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            {mode === 'search' ? 'Ask broadly' : 'Continue the thread'}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Minimal on purpose. Scope stays visible, evidence stays close, and the composer only asks for what matters.
          </p>
        </div>
      </div>

      {datasources.length > 0 ? (
        <div className="flex flex-wrap gap-2 progressive-reveal" style={{ ['--reveal-delay' as string]: '120ms' }}>
          {datasources.map((datasource) => {
            const selected = selectedDatasourceIds.includes(datasource.id);

            return (
              <button
                className="transition"
                key={datasource.id}
                onClick={() => toggleDatasource(datasource.id)}
                type="button"
              >
                <Badge className="px-3 py-1.5" variant={selected ? 'default' : 'outline'}>
                  {datasource.label}
                </Badge>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="progressive-reveal relative" style={{ ['--reveal-delay' as string]: '180ms' }}>
        <Textarea
          aria-label="Search prompt"
          className="min-h-[136px] border-white/8 bg-[rgba(255,255,255,0.02)] pr-18 text-base text-white shadow-none placeholder:text-[var(--muted-foreground)]"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              void submitSearch();
            }
          }}
          placeholder={mode === 'search' ? 'Ask your assistant to search private context with evidence...' : 'Ask a sharper follow-up...'}
          value={draft}
        />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Sparkles className="size-3.5" />
            Cmd/Ctrl + Enter to send
          </div>
          <Button
            aria-label="Submit search"
            disabled={draft.trim().length === 0 || isStreaming}
            onClick={() => void submitSearch()}
            size="icon"
          >
            {isStreaming ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
