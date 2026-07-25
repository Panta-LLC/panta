import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://panta.co',
  integrations: [
    sitemap({
      // Prototype pages stay out of the sitemap until incorporated
      filter: (page) => !page.includes('/journey'),
    }),
  ],
});
