"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import type { Poll } from "@/lib/types";
import { castVoteAction } from "@/lib/actions/engagement";
import { formatShortDate } from "@/lib/format";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";

interface VoteState {
  myVote: string | null;
  counts: Record<string, number>;
}

/**
 * One vote per member, changeable until the poll closes. Clicking your current
 * choice clears it.
 *
 * The optimistic reducer has to move the count off the previous option as well
 * as onto the new one, or a changed vote briefly reads as two votes.
 */
export function PollCard({ slug, poll }: { slug: string; poll: Poll }) {
  const [, startTransition] = useTransition();

  const [state, applyVote] = useOptimistic<VoteState, string>(
    {
      myVote: poll.myVote,
      counts: Object.fromEntries(
        poll.options.map((option) => [option.id, option.voteCount]),
      ),
    },
    (current, optionId) => {
      const counts = { ...current.counts };
      if (current.myVote) counts[current.myVote] -= 1;

      if (current.myVote === optionId) return { myVote: null, counts };

      counts[optionId] = (counts[optionId] ?? 0) + 1;
      return { myVote: optionId, counts };
    },
  );

  const totalVotes = Object.values(state.counts).reduce((a, b) => a + b, 0);

  return (
    <section aria-labelledby="poll-heading">
      <SectionHeading
        title="Group vote"
        meta={state.myVote ? "Your vote is in" : "Waiting on you"}
      />

      <div className="px-5">
        <Card className="p-4">
          <h3
            id="poll-heading"
            className="font-display text-base font-semibold leading-snug text-ink"
          >
            {poll.question}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {totalVotes} of {poll.totalVoters} voted
          </p>

          <ul className="mt-4 space-y-2">
            {poll.options.map((option) => {
              const count = state.counts[option.id] ?? 0;
              const isChosen = state.myVote === option.id;
              const share =
                totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={isChosen}
                    onClick={() =>
                      startTransition(async () => {
                        applyVote(option.id);
                        await castVoteAction(slug, poll.id, option.id);
                      })
                    }
                    className={`
                      relative w-full overflow-hidden rounded-card border px-3 py-2.5
                      text-left transition-colors
                      focus-visible:outline focus-visible:outline-2
                      focus-visible:outline-offset-2 focus-visible:outline-lagoon-dark
                      ${
                        isChosen
                          ? "border-lagoon-dark bg-lagoon/10"
                          : "border-line bg-paper hover:border-lagoon/40"
                      }
                    `}
                  >
                    {/* Result bar sits behind the label. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 bg-lagoon/12 transition-[width] duration-300"
                      style={{ width: `${share}%` }}
                    />

                    <span className="relative flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-text">
                          {isChosen ? (
                            <Check
                              size={13}
                              className="shrink-0 text-lagoon-dark"
                              aria-hidden="true"
                            />
                          ) : null}
                          {option.label}
                        </span>
                        {option.detail ? (
                          <span className="mt-0.5 block text-xs text-muted">
                            {option.detail}
                          </span>
                        ) : null}
                      </span>

                      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-ink-text">
                        {share}%
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-3">
            <Overline>
              Closes {formatShortDate(poll.closesAt.slice(0, 10))} · one vote each
            </Overline>
          </p>
        </Card>
      </div>
    </section>
  );
}
