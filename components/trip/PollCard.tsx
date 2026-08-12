"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Poll } from "@/lib/types";
import { Card, Overline, SectionHeading } from "@/components/shell/Card";

/**
 * Voting is optimistic and local for now. With the data layer it becomes an
 * upsert into `poll_votes` keyed by (poll_id, user_id) — one vote per member,
 * changeable until `closes_at` — with the counts derived rather than stored.
 */
export function PollCard({ poll }: { poll: Poll }) {
  const [votedFor, setVotedFor] = useState<string | null>(null);

  const options = poll.options.map((option) => ({
    ...option,
    voteCount: option.voteCount + (votedFor === option.id ? 1 : 0),
  }));

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <section aria-labelledby="poll-heading">
      <SectionHeading
        title="Group vote"
        meta={votedFor ? "Your vote is in" : "Waiting on you"}
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
            {options.map((option) => {
              const isChosen = votedFor === option.id;
              const share =
                totalVotes > 0
                  ? Math.round((option.voteCount / totalVotes) * 100)
                  : 0;

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={isChosen}
                    onClick={() =>
                      setVotedFor((current) =>
                        current === option.id ? null : option.id,
                      )
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
            <Overline>Closes 14 Sep · one vote each</Overline>
          </p>
        </Card>
      </div>
    </section>
  );
}
