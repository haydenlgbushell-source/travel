-- Lets the Info tab give real trips the same destination-aware content the
-- authored Chicago example always had (emergency number, travel-advice
-- link) instead of nothing at all. Nullable and backfilled with nothing —
-- an existing trip simply shows no destination-specific content until it's
-- next saved, same as it always did for `destination`/`lat`/`lng` above it.
alter table public.trips add column country text;
