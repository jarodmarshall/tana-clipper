Project Roadmap

Version 1 Milestone 1: Project setup, manifest v3 baseline, background/content scripts scaffolded, lint/test tooling agreed.
Version 1 Milestone 2: Context-menu integration (register item, permission handling, data flow to background).
Version 1 Milestone 3: Clipboard handling pipeline (content extraction, normalization, copy to clipboard, success/error UX).
Version 1 Milestone 4: Packaging + QA handoff (README draft, test plan, acceptance review).
Version 2 Milestone 1: Popup UI shell with state store; reuse background/content services.
Version 2 Milestone 2: Implement 3 capture modes (element picker, full page, bookmark) + QA regression.
Directory Baseline (v1)

manifest.json — permissions (contextMenus, scripting, clipboardWrite), background service worker entry.
src/background/ — index.ts (event routing), context-menu.ts (menu creation, click handler), clipboard.ts (write logic).
src/content/ — index.ts (message router), extractors/dom.ts (selected text & metadata).
src/common/ — types.ts, messages.ts, logger.ts (shared utils).
public/ — icons, popup.html placeholder, options.html if needed later.
tests/ — integration mocks for context menu events, unit tests for extractors/clipboard.
tools/ — build scripts (vite/webpack config), lint, packaging script.
package.json — scripts: dev, build, lint, test, package.
Dependencies & APIs

Chrome APIs: chrome.contextMenus, chrome.scripting (inject content helpers if absent), chrome.storage.sync (future state), navigator.clipboard.writeText.
Libraries: webextension-polyfill for Promises, tslib if using TypeScript compile, jest/vitest + @types/chrome.
Build tooling: Vite (preferred) or Webpack with copy-webpack-plugin for manifest/assets.
Front-End Handoff

Provide specs for src/content/index.ts messaging contract and clipboard payload shape.
Document message names in src/common/messages.ts; FE to implement DOM extraction and success/error feedback.
Deliver wireframe for future popup (even if dormant) so FE can stub HTML/CSS under public/popup.html.
Clarify testing expectations: DOM extractor unit tests, manual flow check via chrome://extensions in dev mode.
QA Handoff

README sections: setup, dev server/build, loading unpacked extension, feature checklist, troubleshooting.
Deployment guide: version bump, npm run build, archive /dist, update Chrome Web Store listing.
Test plan: context menu presence, clipboard accuracy (plain text + rich text), permissions, failure states.
Automation pointers: consider Playwright with Chrome extension support for later CI.
Version 2 Extension Notes

Keep background message router generic to allow popup actions (context menu already using same dispatch).
Store capture strategies in src/background/capture/ with shared interface so popup can call same modules.
Popup should talk to background via chrome.runtime.sendMessage, reusing messages.ts.
Element picker lives in src/content/picker/; loader toggled by commands from both context menu and popup.
Bookmark capture uses new helper src/background/capture/bookmark.ts; integrates without touching v1 clipboard flow.
Ensure manifest permissions future-proof: add activeTab, optional bookmarks toggled via optional_permissions.
Next Steps

Confirm TypeScript vs plain JS choice so scaffolding can begin.
Spin up FE agent to implement src/content extractor, menu UX messaging.
QA agent drafts README/test plan while Milestone 2 wraps.
