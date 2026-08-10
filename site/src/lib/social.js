/**
 * Social profiles: the platform registry, and the normaliser that both the
 * footer and the Organization JSON-LD read.
 *
 * Editors pick a platform and paste a URL in the Studio
 * (studio/schemaTypes/socialProfile.ts). The platform *value* is the contract
 * between the two halves, and this table is the site's half — Studio and site
 * are separate packages with no shared module, so the list is duplicated on
 * purpose. See the note on SOCIAL_PLATFORMS there.
 */

/**
 * Platform value → the name we show. `other` is deliberately absent: it has no
 * name of its own, so the Studio requires an explicit label for it and an
 * entry without one is dropped below.
 */
export const PLATFORM_LABELS = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  x: 'X',
  bluesky: 'Bluesky',
  threads: 'Threads',
  tiktok: 'TikTok',
  github: 'GitHub',
};

/**
 * Platforms SocialIcon.astro actually draws a glyph for. Kept here rather than
 * inferred from the component so the footer can decide the row's shape — icons
 * or text — before rendering anything. Adding a glyph means adding it in both
 * places, and forgetting this one degrades to a text link rather than a blank.
 */
export const ICON_PLATFORMS = new Set(['linkedin', 'instagram', 'facebook', 'x']);

const titleCase = (v) => v.charAt(0).toUpperCase() + v.slice(1);

/**
 * Turn the raw `siteSettings.socialProfiles` array into render-ready links.
 *
 * Drops anything that cannot produce a working, labelled link, because both
 * consumers publish rather than merely display: an unlabelled link is
 * unreachable by screen reader, and a URL-less `sameAs` entry is malformed
 * structured data. Silence is the correct failure here — the alternative is a
 * footer link reading "Other" pointing at nothing.
 *
 * A platform this file has not caught up with yet (added in the Studio list
 * first) falls back to its title-cased value, so it renders as "Mastodon"
 * rather than vanishing. That is the mismatch the Studio comment warns about:
 * visible, and harmless.
 *
 * @param {Array<{platform?: string, url?: string, label?: string}>} [profiles]
 * @returns {Array<{platform: string, label: string, url: string, cta: string}>}
 */
export function normalizeSocialProfiles(profiles) {
  if (!Array.isArray(profiles)) return [];

  return profiles.flatMap((p) => {
    const url = p?.url?.trim();
    const platform = p?.platform?.trim();
    if (!url || !platform) return [];

    // An explicit label always wins — it is how an editor writes "Panta on
    // LinkedIn" or names an `other` profile.
    const label =
      p.label?.trim() ||
      PLATFORM_LABELS[platform] ||
      (platform === 'other' ? '' : titleCase(platform));
    if (!label) return [];

    // Matches the data-track-cta convention used across the footer links.
    return [{ platform, label, url, cta: `social_${platform}`, hasIcon: ICON_PLATFORMS.has(platform) }];
  });
}
