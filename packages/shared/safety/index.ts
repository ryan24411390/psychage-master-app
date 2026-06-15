// @psychage/shared/safety — crisis-detection helpers shared across Psychage apps.
// Add exports here rather than deep-importing (see CLAUDE.md).
//
// `precheckCrisis` is the client-side defense-in-depth CRISIS pre-check; it mirrors
// the web server's CRISIS_KEYWORDS tier. CRISIS_KEYWORDS itself stays internal to
// the module (the drift-guard test deep-imports it); consumers call precheckCrisis.
export { precheckCrisis } from './crisis-keywords';
