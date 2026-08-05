// Script videos (see UPDATED_VIDEO_SCRIPTS.md) live in public/video/ and are
// detected on disk at build time. There is no Sanity field for them — the
// Studio is a separate project and the schema can't be extended from here — so
// presence IS the switch: drop the files in, rebuild, the slot appears.
//
// Resolved against the project root, NOT import.meta.url. Vite rewrites
// import.meta.url in the SSR build, so a relative URL silently resolves to a
// bundle path and every check comes back false.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Look up a script video by basename (e.g. 'panta-intro' for
 * public/video/panta-intro.mp4).
 *
 * Both the video and its poster must exist — a video with no poster would load
 * as a black rectangle in the first viewport, which is worse than no video.
 * Captions are optional.
 */
export function videoAssets(name) {
  const src = `/video/${name}.mp4`;
  const poster = `/video/${name}-poster.jpg`;
  const captions = `/video/${name}.en.vtt`;
  const onDisk = (p) => existsSync(join(process.cwd(), 'public', p));

  const has = onDisk(src) && onDisk(poster);
  return { has, src, poster, captions, hasCaptions: has && onDisk(captions) };
}
