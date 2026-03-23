import { useAtomValue, useSetAtom } from 'jotai';
import { ChevronRight } from 'lucide-react';
import { followUpsAtom, isStreamingAtom, stageFollowUpAtom } from '@/lib/atoms/search';

export function FollowUpChips() {
  const followUps = useAtomValue(followUpsAtom);
  const isStreaming = useAtomValue(isStreamingAtom);
  const stageFollowUp = useSetAtom(stageFollowUpAtom);

  if (followUps.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-6">
      {followUps.map((prompt, index) => (
        <button
          className="surface-border progressive-reveal inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.03)] px-3 py-2 text-sm transition hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-50"
          disabled={isStreaming}
          key={prompt}
          onClick={() => stageFollowUp(prompt)}
          style={{ ['--reveal-delay' as string]: `${80 + index * 65}ms` }}
          type="button"
        >
          <ChevronRight className="size-4 text-[var(--primary)]" />
          {prompt}
        </button>
      ))}
    </div>
  );
}
