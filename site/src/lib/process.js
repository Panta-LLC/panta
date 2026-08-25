/**
 * The three steps, in one place.
 *
 * They were a literal inside index.astro. `/process/` now renders the same
 * three (journey-redesign.md §3), and copy that describes a commitment — 30
 * minutes, 48 hours, a fixed price agreed before work starts — must not exist
 * twice: the moment it does, one copy gets edited and the site quietly promises
 * two different things.
 *
 * `title` and `body` are what the homepage section shows. `output` and `note`
 * are the extra detail /process/ adds and the homepage has no room for, which
 * is why they live here rather than being a second array on that page.
 */
/**
 * The launch copy, and the fallback. `siteSettings.processSteps` is the live
 * source (studio/schemaTypes/siteSettings.ts) — this array is what renders when
 * that field is empty or the fetch returns nothing, so an unedited Studio still
 * produces today's page rather than a blank section.
 *
 * Kept in the repo rather than deleted after seeding for the same reason the
 * seeded service copy is: a diff is where copy gets reviewed, and a build that
 * loses its Sanity connection must still ship the three commitments intact.
 */
export const STEPS = [
  {
    n: '1',
    title: 'The Review.',
    /* Deliberately does NOT re-pitch the offer: the homepage sells it in full a
       screen above where this renders, and the two ran word-for-word identical.
       A process step says what happens, not what it costs you nothing. */
    body: 'In 30 minutes, we discuss where things stand today and explore the best path forward. You tell us your top priorities and we share our recommendations on what the best first step might be. We follow up with a written summary, which you can use to make a decision or hand off to someone else.',
    output:
      'a one-page written readout within 48 hours — three observations and the one thing we would do first, in plain language. Yours to keep, act on, or hand to whoever builds your site.',
    note: 'Free, and it ends here if you want it to. Most of what is on that page you can do yourself.',
  },
  {
    n: '2',
    title: 'Plan together.',
    body: 'We follow up on the Review with a detailed plan of action, agree on a scope of work, set a timeline, and get started. The path forward is always in your hands.',
    output:
      'a written scope and a fixed price, plus a date. No hourly billing and no retainer you have to decode. Nothing starts until you have both in hand.',
  },
  {
    n: '3',
    title: 'Build and support.',
    body: 'We execute on the plan, review progress on an agreed-upon cadence, and make adjustments as needed. We stay reachable and responsive to your feedback and questions. Upon delivery, we hand over the project, answer any final questions, and offer ongoing support as agreed upon.',
    output:
      'the finished thing, in accounts you own, with whatever handover you need to run it without us. Support afterward is agreed, not assumed.',
  },
];

/**
 * The steps to render: the Studio's if an editor has written them, otherwise
 * the launch copy above.
 *
 * All-or-nothing rather than field-by-field. A per-field merge would let a
 * half-filled Studio array silently mix new copy with old, which is exactly how
 * two versions of a commitment end up on one page.
 */
export const resolveSteps = (fromCms) =>
  Array.isArray(fromCms) && fromCms.length > 0 ? fromCms : STEPS;
