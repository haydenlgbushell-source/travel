# Database

The project's migration history lives in Supabase, not in this repo — the
thirty-odd migrations that built `trips`, `trip_members`, `agencies` and the
rest were applied directly and were never checked in. `supabase migration
list` against the project is the authoritative history.

The two files here are the ones added since, kept under their applied
version numbers so the names line up with that history. Both are **already
applied** to the Wayfare project; they are checked in as a record and so the
schema can be rebuilt somewhere else, not as a to-do.
