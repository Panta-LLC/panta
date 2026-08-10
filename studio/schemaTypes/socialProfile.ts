import {defineField, defineType} from 'sanity'

/**
 * One social profile: where Panta exists off-site, and under what name.
 *
 * Used only as an array member on Site settings — there is no document type
 * here because a profile has no life of its own. It is a URL plus enough
 * information to label it, and the order it sits in the array is the order it
 * renders in the footer.
 *
 * `platform` is a fixed list rather than free text because two things key off
 * it: the footer's link label and, later, an icon. The site holds the matching
 * half of this list in `site/src/lib/social.js` — the two are separate npm
 * packages with no shared module, so the values are duplicated on purpose.
 * Adding a platform means editing both; the site degrades to a title-cased
 * version of the value if only this half is updated, so a mismatch shows up as
 * an ugly label rather than a missing link.
 */

export const SOCIAL_PLATFORMS = [
  {title: 'LinkedIn', value: 'linkedin'},
  {title: 'Instagram', value: 'instagram'},
  {title: 'Facebook', value: 'facebook'},
  {title: 'YouTube', value: 'youtube'},
  {title: 'X (Twitter)', value: 'x'},
  {title: 'Bluesky', value: 'bluesky'},
  {title: 'Threads', value: 'threads'},
  {title: 'TikTok', value: 'tiktok'},
  {title: 'GitHub', value: 'github'},
  // Anything without a slot above — Substack, Mastodon, Patreon, a directory
  // listing. Requires an explicit Label, since "Other" is not a name.
  {title: 'Other', value: 'other'},
]

export default defineType({
  name: 'socialProfile',
  type: 'object',
  title: 'Social profile',
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      title: 'Platform',
      options: {list: SOCIAL_PLATFORMS},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      type: 'url',
      title: 'Profile URL',
      description:
        'The full public URL of the profile, e.g. https://www.linkedin.com/company/panta-llc. Paste it from the browser rather than typing it — this is also what tells Google the profile belongs to Panta, so a URL that 404s or redirects to a login wall is worse than no entry at all.',
      // https only: these URLs are published in the page's Organization JSON-LD
      // as `sameAs`, and an http one there is a mixed-content citation.
      validation: (Rule) => Rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'label',
      type: 'string',
      title: 'Label',
      description:
        'Overrides the link text. Leave empty to use the platform name, which is right almost always. Required when Platform is "Other".',
      validation: (Rule) =>
        Rule.custom((label, context) =>
          (context.parent as {platform?: string})?.platform === 'other' && !label?.trim()
            ? 'A label is required when the platform is "Other" — otherwise the footer has nothing to call this link.'
            : true
        ),
    }),
  ],
  preview: {
    select: {platform: 'platform', label: 'label', url: 'url'},
    prepare: ({platform, label, url}) => ({
      title:
        label?.trim() ||
        SOCIAL_PLATFORMS.find((p) => p.value === platform)?.title ||
        'Social profile',
      subtitle: url,
    }),
  },
})
