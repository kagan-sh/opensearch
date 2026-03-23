import { useAtomValue } from 'jotai';
import { Menu, PanelRightOpen, Plus, Search } from 'lucide-react';
import { AnswerSurface } from '@/components/answer-surface';
import { FollowUpChips } from '@/components/follow-up-chips';
import { SearchComposer } from '@/components/search-composer';
import { SourceRail } from '@/components/source-rail';
import { ThreadRail } from '@/components/thread-rail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  activeThreadAtom,
  isBootstrappingAtom,
  lastErrorAtom,
  leftRailOpenAtom,
  sourceRailOpenAtom,
  useSearchActions,
  useSearchBootstrap,
} from '@/lib/atoms/search';

export default function App() {
  useSearchBootstrap();

  const activeThread = useAtomValue(activeThreadAtom);
  const isBootstrapping = useAtomValue(isBootstrappingAtom);
  const lastError = useAtomValue(lastErrorAtom);
  const leftRailOpen = useAtomValue(leftRailOpenAtom);
  const sourceRailOpen = useAtomValue(sourceRailOpenAtom);
  const { setLeftRailOpen, setSourceRailOpen, createBlankThread } = useSearchActions();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(113,225,236,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(90,88,255,0.1),transparent_20%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1720px] gap-3 p-3 sm:p-4">
        <aside className="hidden w-[300px] shrink-0 xl:block">
          <ThreadRail />
        </aside>

        {leftRailOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              aria-label="Close history rail"
              className="absolute inset-0 bg-black/45"
              onClick={() => setLeftRailOpen(false)}
              type="button"
            />
            <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[320px] p-3">
              <ThreadRail />
            </div>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <Card className="glass-panel noise-overlay progressive-reveal flex items-center justify-between gap-3 overflow-hidden px-3 py-3 sm:px-5" style={{ ['--reveal-delay' as string]: '40ms' }}>
            <div className="flex min-w-0 items-center gap-3">
              <Button
                aria-label="Open history rail"
                className="xl:hidden"
                onClick={() => setLeftRailOpen(true)}
                size="icon"
                variant="ghost"
              >
                <Menu className="size-4" />
              </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                    <Search className="size-3.5 text-[var(--primary)]" />
                    OpenSearch
                  </div>
                  <h1 className="truncate text-lg font-semibold tracking-[-0.04em] text-white sm:text-xl">
                    {activeThread?.title ?? 'Private search for LLMs'}
                  </h1>
                  <p className="mt-1 hidden text-sm text-[var(--muted-foreground)] sm:block">
                    Dark, minimal, source-backed retrieval for assistant workflows.
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-2">
              <Badge className="hidden md:inline-flex" variant="outline">
                Privacy-first by default
              </Badge>
              <Button onClick={() => createBlankThread()} size="sm" variant="secondary">
                <Plus className="size-4" />
                New Thread
              </Button>
              <Button
                aria-label="Open sources rail"
                className="2xl:hidden"
                onClick={() => setSourceRailOpen(true)}
                size="icon"
                variant="ghost"
              >
                <PanelRightOpen className="size-4" />
              </Button>
            </div>
          </Card>

          <div className="grid min-h-0 flex-1 gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="glass-panel progressive-reveal flex min-h-[calc(100vh-10rem)] flex-col overflow-hidden" style={{ ['--reveal-delay' as string]: '110ms' }}>
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                      Progressive reveal
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                      Keep the interface quiet until evidence arrives. Threads, citations, and follow-ups reveal themselves as the answer hardens.
                    </p>
                  </div>
                  <Badge variant="secondary">{activeThread ? 'Active thread' : 'Ready'}</Badge>
                </div>
                {isBootstrapping ? (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">Loading threads and datasource policy...</p>
                ) : null}
                {lastError ? (
                  <p className="mt-3 text-sm text-[var(--destructive)]">{lastError}</p>
                ) : null}
              </div>
              <Separator />
              <div className="edge-fade flex min-h-0 flex-1 flex-col">
                <AnswerSurface />
                <FollowUpChips />
              </div>
              <Separator />
              <SearchComposer />
            </Card>

            <aside className="hidden min-w-0 2xl:block">
              <SourceRail />
            </aside>
          </div>
        </main>

        {sourceRailOpen ? (
          <div className="fixed inset-0 z-40 2xl:hidden">
            <button
              aria-label="Close sources rail"
              className="absolute inset-0 bg-black/45"
              onClick={() => setSourceRailOpen(false)}
              type="button"
            />
            <div className="absolute inset-y-0 right-0 w-[88vw] max-w-[340px] p-3">
              <SourceRail />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
