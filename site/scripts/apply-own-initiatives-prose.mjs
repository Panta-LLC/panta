/**
 * Final sweep of the practice→initiative reframing: the prose that still calls
 * these "practices taking root".
 *
 *   node scripts/apply-own-initiatives-prose.mjs            # dry run
 *   node scripts/apply-own-initiatives-prose.mjs --apply    # writes
 *
 * apply-own-initiatives.mjs moved the labels and CTAs; these are the sentences
 * inside the pages. "Practice" is left alone where it means a therapist's or
 * consultant's practice — that is an audience term, not the retired taxonomy.
 */
import { run } from './lib/apply-edits.mjs';

await run({
  name: 'Own initiatives — remaining prose',

  sets: [
    [
      'communityProgramsPage',
      'ctaLabel',
      'This practice is taking root',
      'Early days',
    ],
    [
      'communityProgramsPage',
      'heroLede',
      "The resources a community needs usually already exist — they're just out of reach of the people who need them. This practice builds the programs that close that gap.",
      "The resources a community needs usually already exist — they're just out of reach of the people who need them. We build programs that close that gap.",
    ],
    [
      'productDevelopmentPage',
      'ctaLabel',
      'This practice is taking root',
      'Early days',
    ],
    [
      'productDevelopmentPage',
      'heroLede',
      // Straight apostrophe — that is what is stored; the guard caught the
      // curly one and refused to write, which is the point of it.
      "Not every problem is solved by a tool that exists or an introduction waiting to be made. Some are solved by building something that didn't exist yesterday. This practice is where we do that.",
      'Not every problem is solved by a tool that exists or an introduction waiting to be made. Some are solved by building something that didn’t exist yesterday. That is what we release here.',
    ],
  ],
});
