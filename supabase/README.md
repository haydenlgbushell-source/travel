# Database

This repo's one live Supabase project is **Wayfare**, project ref
`elvctcbnnohjxiqonpbo` (ap-southeast-2) — pinned in `config.toml` alongside
this file so nothing has to find it by name among the account's other
projects. Point any Supabase CLI or tool at that ref, not a name search.

The project's migration history lives in Supabase, not in this repo — the
thirty-odd migrations that built `trips`, `trip_members`, `agencies` and the
rest were applied directly and were never checked in. `supabase migration
list` against the project is the authoritative history.

The files here are the ones added since, kept under their applied version
numbers so the names line up with that history. All of them are **already
applied** to the Wayfare project; they are checked in as a record and so the
schema can be rebuilt somewhere else, not as a to-do.
