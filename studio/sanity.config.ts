import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

// Singleton page documents: one instance each, addressed by a literal _id that
// the site's getDoc() fetches directly (see site/src/lib/sanity.js). They must
// not be creatable or deletable from the Studio, or the site loses its content.
const SINGLETONS = [
  {id: 'homeHero', title: 'Home hero (/)'},
  // Named for what it renders, not what it used to: the homepage moved to the
  // Pulse build, and this document now only supplies the verbs and origin
  // story on /about/.
  {id: 'missionPage', title: 'Mission content (used on /about/)'},
  {id: 'homePage', title: 'What we do (/what-we-do/)'},
  {id: 'aboutPage', title: 'About'},
  // Orphaned since the Pulse homepage replaced the merged one — nothing reads
  // this. Kept so the content is recoverable if those sections are revived.
  {id: 'webStrategyPage', title: 'Web & Systems (unused)'},
  {id: 'websitesPage', title: 'Websites'},
  {id: 'planPage', title: 'Digital Presence Plan'},
  {id: 'consultationPage', title: 'Pulse Check booking (/consultation/)'},
  {id: 'contactPage', title: 'Contact'},
  {id: 'workPage', title: 'Work'},
  {id: 'siteSettings', title: 'Site settings'},
]

const SINGLETON_IDS = new Set(SINGLETONS.map((s) => s.id))

// Fixed-set types: a collection whose membership is brand structure rather
// than content. Editable, but not creatable or deletable — a fourth pillar
// would render a fourth homepage column with no services under it, and a
// deleted one would orphan every service assigned to it. Seeded by
// `site/scripts/seed-pillars.mjs`.
const FIXED_SET_TYPES = new Set(['pillar'])

const PROTECTED_TYPES = new Set([...SINGLETON_IDS, ...FIXED_SET_TYPES])

export default defineConfig({
  name: 'pantaco',
  title: 'pantaco',

  projectId: 'tdi9ql1j',
  dataset: 'pantaco',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Pages')
              .child(
                S.list()
                  .title('Pages')
                  .items(
                    SINGLETONS.map((s) =>
                      S.listItem()
                        .title(s.title)
                        .id(s.id)
                        .child(S.document().schemaType(s.id).documentId(s.id).title(s.title))
                    )
                  )
              ),
            S.divider(),
            S.listItem()
              .title('Pulse')
              .child(
                S.list()
                  .title('Pulse')
                  .items([
                    S.documentTypeListItem('post').title('Posts'),
                    S.documentTypeListItem('category').title('Categories'),
                    S.documentTypeListItem('author').title('Authors'),
                  ])
              ),
            S.divider(),
            S.documentTypeListItem('pillar').title('Pillars'),
            S.documentTypeListItem('service').title('Services'),
            S.documentTypeListItem('client').title('Clients'),
            S.documentTypeListItem('project').title('Projects'),
            S.documentTypeListItem('testimonial').title('Testimonials'),
            S.documentTypeListItem('practiceTeaserPage').title('What we’re building'),
          ]),
    }),
    visionTool({defaultDataset: 'pantaco'}),
  ],

  schema: {
    types: schemaTypes,
    // Singletons are reachable only through the Pages list above; pillars are
    // a fixed set of three, seeded rather than created.
    templates: (prev) => prev.filter((t) => !PROTECTED_TYPES.has(t.schemaType)),
  },

  document: {
    actions: (prev, {schemaType}) =>
      PROTECTED_TYPES.has(schemaType)
        ? prev.filter(({action}) => action !== 'unpublish' && action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
