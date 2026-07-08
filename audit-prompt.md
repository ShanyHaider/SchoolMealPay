I'm auditing how caching is used across a Next.js 16 App Router project with
Cache Components enabled (cacheComponents: true in next.config.ts). Stack: Drizzle
ORM + PostgreSQL, Clerk for auth, Stripe for payments.

CONTEXT: I recently found and fixed two bugs caused by cache/dynamic-rendering
mismatches in the canteen-staff routes:

1. A page.tsx calling a "use cache" query function while the page itself had no
   `connection()` opt-out, causing it to be pulled into static prerendering where
   the DB query failed silently.
2. currentUser() from Clerk failing during that same unwanted prerender pass.

I suspect this pattern of "use cache" being applied without a clear, deliberate
revalidation strategy may exist elsewhere in the app. I also want to know where
caching is being underused or misapplied in a way that hurts performance — not just
where it's structurally broken. I do NOT want you to change any caching behavior yet
— this is an inventory/audit pass only. No edits to cache directives, cacheLife
values, revalidation calls, or connection() calls in this pass.

TASK 1 — QUERY INVENTORY: Scan the entire db/queries directory and db/actions
directory (and any other directories containing server actions or data-fetching
functions — check for "use server" and "use cache" directives project-wide if those
two aren't exhaustive).

For EVERY function found, produce a table with these columns:

1. File path
2. Function name
3. Has "use cache"? (yes/no)
4. cacheLife value (if applicable)
5. cacheTag value(s) (if applicable)
6. What data it fetches/reads (one line)
7. Which page(s)/layout(s)/component(s) call it (search for usages)
8. Does the calling page/layout have `await connection()` or is it wrapped in
   <Suspense> appropriately, given whether the cached function needs request-time
   freshness? (yes/no/unclear)

TASK 2 — MUTATION INVENTORY: Produce a second table for all mutation functions
(server actions — creates, updates, deletes, webhook handlers):

1. File path
2. Function name
3. What it mutates (table/rows affected)
4. What revalidateXCache / revalidateTag / revalidatePath / updateTag calls it
   currently makes (list them, or "NONE" if it makes none)
5. Based on table 1, which cached query functions/tags SHOULD be invalidated by this
   mutation but currently are NOT (cross-reference — flag any gaps)

TASK 3 — CORRECTNESS FLAGS: Write a short section listing:

- Any query function with "use cache" whose data looks like it needs to be live/
  real-time (e.g., live order status, active sessions, payment state) where caching
  seems risky or mismatched with its cacheLife.
- Any page/layout that calls a cached function but has no `connection()`/<Suspense>
  opt-out and isn't itself statically appropriate.
- Any mutation missing a revalidation call for cache tags/paths it should invalidate.
- Any inconsistency in cacheLife choices for conceptually similar data.

TASK 4 — PERFORMANCE / OPTIMIZATION FLAGS: Separately from correctness, identify:

- Functions or data that are fetched frequently but have NO "use cache" at all —
  candidates for adding caching to reduce redundant DB load.
- Any query function called repeatedly within the same request/render (N+1 pattern)
  that could be batched or hoisted into one cached call.
- Pages/layouts doing sequential await calls to independent data sources that
  could be parallelized with Promise.all.
- Any cacheLife value that seems too short for genuinely static/slow-changing data,
  or too long for volatile data — cross-reference against Task 2's mutations.
- Any client-side polling (e.g., setInterval + router.refresh()) that duplicates
  what cached functions could serve more efficiently, or that could be a load
  source if scaled up with more concurrent staff users.
- Large/expensive queries (multiple joins, nested json_agg, etc.) that are NOT
  cached and run on every request — flag as high-value caching candidates.

Do not fix anything in this pass. Just report findings in the tables and flag
sections above so I can review and decide what to change, and in what order.
