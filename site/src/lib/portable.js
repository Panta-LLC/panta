/**
 * Portable-text helpers for the short rich-text fields — `richText` and
 * `richList` in the Studio (see studio/schemaTypes/richText.ts).
 *
 * Separate from components/PortableText.astro, which renders Pulse article
 * bodies at a fixed measure in Spectral. These fields render inside a card, a
 * hero and a CTA panel, so what is needed here is the inline HTML with no
 * typography of its own — the surrounding rule keeps owning the type.
 *
 * EVERY function accepts a plain string as well as a block array. Package copy
 * was strings until migrate-package-richtext.mjs ran, drafts written before it
 * still hold strings, and a field that renders one shape and throws on the
 * other would take the homepage down over an unmigrated draft.
 */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const blocksOf = (value) => (Array.isArray(value) ? value.filter((b) => b?._type === 'block') : []);

const spansOf = (block) =>
  (block?.children ?? []).filter((c) => c?._type === 'span' && typeof c.text === 'string');

/**
 * Only the schemes the annotation's own validation allows, plus in-site paths.
 * Re-checked here rather than trusted: validation runs when a field is edited,
 * and a document can reach the dataset by other routes — imports, scripts, the
 * API. `javascript:` is the reason this is not a pass-through.
 */
const safeHref = (href) => {
  if (typeof href !== 'string') return null;
  const value = href.trim();
  if (!value) return null;
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith('/') || value.startsWith('#')) return value;
  return null;
};

/** One block's children as HTML: decorators inside, link annotation outside. */
const renderSpans = (block) => {
  const defs = new Map((block?.markDefs ?? []).map((d) => [d?._key, d]));
  return spansOf(block)
    .map((span) => {
      let html = esc(span.text);
      const marks = span.marks ?? [];
      if (marks.includes('strong')) html = `<strong>${html}</strong>`;
      if (marks.includes('em')) html = `<em>${html}</em>`;

      // Anything in `marks` that is not a decorator is an annotation key. Only
      // links are defined; an unknown annotation renders as its text.
      for (const key of marks) {
        const def = defs.get(key);
        if (def?._type !== 'link') continue;
        const href = safeHref(def.href);
        if (!href) continue;
        const external = /^https?:/i.test(href);
        html = `<a href="${esc(href)}"${external ? ' rel="noopener"' : ''}>${html}</a>`;
      }
      return html;
    })
    .join('');
};

/** Plain text, for <meta> content and JSON-LD, where markup cannot go. */
export const toPlainText = (value) => {
  if (typeof value === 'string') return value;
  return blocksOf(value)
    .map((b) => spansOf(b).map((s) => s.text).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/** Is there anything to render? Drives the "section renders only when written"
 *  rule on the package page — an empty editor is `[]`, not undefined. */
export const hasText = (value) => toPlainText(value).length > 0;

/** Paragraph HTML strings. A plain string becomes one paragraph. */
export const paragraphs = (value) => {
  if (typeof value === 'string') {
    return value.split(/\n{2,}/).map((p) => esc(p.trim())).filter(Boolean);
  }
  return blocksOf(value)
    .filter((b) => !b.listItem)
    .map(renderSpans)
    .filter((html) => html.trim());
};

/**
 * List-item HTML strings.
 *
 * Non-list paragraphs count as items too: `richList` offers the bullet button
 * but does not force it, and an editor who types three lines without pressing
 * it means three bullets. Dropping them would silently lose the copy.
 */
export const listItems = (value) => {
  if (typeof value === 'string') return value.trim() ? [esc(value.trim())] : [];
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value.filter((v) => v?.trim()).map((v) => esc(v.trim()));
  }
  return blocksOf(value)
    .map(renderSpans)
    .filter((html) => html.trim());
};
