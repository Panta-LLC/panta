/**
 * Assert a signed-in user inside a page or endpoint.
 *
 * The middleware has already redirected anyone without a session, so reaching
 * a guarded route with locals.user === null means a bug (most likely a path
 * wrongly added to PUBLIC_PREFIXES). Throwing here turns that into a loud
 * 500 rather than a page that quietly renders someone else's view of nothing.
 */
import type { SessionUser } from './session.ts';

export function requireUser(locals: App.Locals): SessionUser {
  if (!locals.user) {
    throw new Error(
      'requireUser() called on a route with no session. Check PUBLIC_PREFIXES in src/middleware.ts.',
    );
  }
  return locals.user;
}
