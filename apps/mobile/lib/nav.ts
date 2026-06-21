import { type Href, router } from 'expo-router';

// Navigation helpers that harden against an empty history stack.
//
// `router.back()` is a no-op (and strands the user on a chrome-minimal
// full-screen route with no tab bar) when there is nothing to pop — which
// happens on a cold start into a deep link, on a screen reached via
// `router.replace`, or when the OS process was restored to a single route.
// Every full-screen tool exit and detail "back" affordance should route
// through `goBackOr` so the user always lands somewhere navigable.

/**
 * Pop the stack when possible; otherwise replace to a known-good fallback
 * (e.g. the owning tab landing) so the user is never trapped.
 */
export function goBackOr(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

/**
 * Open the article reader for a slug. Centralized so every entry point pushes the
 * SAME root-level `/article/[slug]` route over the tabs — back then returns to the
 * exact origin tab (Today or Learn), not the Learn landing (nav bug P5). The route
 * lives at `app/article/[slug].tsx` (root), so this push covers the tabs.
 */
export function openArticle(slug: string): void {
  router.push({ pathname: '/article/[slug]', params: { slug } });
}
