/**
 * JSON-LD builders.
 *
 * The same `provider` object literal was hand-copied into five pages, and the
 * Service blocks had drifted — none carried a canonical `url`, and the plan
 * page was missing `areaServed`. One builder keeps them identical.
 */

/** The organisation node, referenced as provider/creator everywhere. */
export const ORG = {
  '@type': 'ProfessionalService',
  name: 'Panta LLC',
  url: 'https://panta.llc',
};

export const serviceSchema = ({name, serviceType, description, url, areaServed}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  serviceType: serviceType ?? name,
  provider: ORG,
  description,
  areaServed: areaServed ?? 'United States',
  ...(url ? {url} : {}),
});

/**
 * Returns null rather than an empty FAQPage when there are no questions —
 * callers spread through `.filter(Boolean)`, which is also what makes the
 * no-FAQ case safe on a page that used to map over `faqs` unguarded.
 */
export const faqSchema = (faqs) =>
  (faqs ?? []).length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(({q, a}) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: {'@type': 'Answer', text: a},
        })),
      }
    : null;

export const creativeWorkSchema = ({name, about, description, url}) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name,
  creator: ORG,
  ...(about ? {about} : {}),
  ...(description ? {description} : {}),
  ...(url ? {subjectOf: {'@type': 'WebSite', url}} : {}),
});
