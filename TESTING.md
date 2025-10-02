# Manual Test Checklist

Follow these scenarios after loading the built extension (`dist/`) through `chrome://extensions` in Developer Mode. Clear the clipboard before each test to ensure results are fresh.

## 1. Select Text → Clip with Metadata
- Open an article with headline, author, and paragraph text.
- Highlight a paragraph, right-click, choose **Clip to Tana**.
- Expected clipboard contents:
  ```
  %%tana%%
  - [[Clipping]]
    - > Quote from article
    - [[Source URL]]:: https://example.com
    - [[Captured At]]:: 2024-05-01T12:30:00Z
  ```
- Confirm pasted node in Tana matches the hierarchy. Validate fields against the [spec](./docs/tana-paste-docs.pdf).

## 2. Select Image → Clip with Metadata
- On a page containing an inline image, right-click the image and pick **Clip to Tana**.
- Expected clipboard contents include an attachment node:
  ```
  %%tana%%
  - [[Image Clip]]
    - [[Alt Text]]:: sample alt
    - [[Image URL]]:: https://example.com/image.png
    - [[Source URL]]:: https://example.com
  ```
- Ensure the clipboard entry references the correct image URL and includes available alt text or caption.

## 3. Clip Without Metadata
- Select plain text in a page lacking metadata (e.g., local HTML snippet).
- Trigger **Clip to Tana**.
- Expect a minimal payload containing only the captured text and timestamp (no title/author fields).
- Paste into Tana and verify optional attributes are omitted rather than empty strings.

## 4. Edge Cases
- **Empty Selection:** Right-click the page background without selecting anything. Menu item should be disabled or no clipboard change should occur; check console for informative warning.
- **Image-Only Page:** Load a page that serves a single `<img>` (no HTML body text). Clip the image and confirm fallback metadata (URL, timestamp) still populate.
- **Large Selection:** Highlight several paragraphs to ensure payload size does not truncate important metadata.

## Logging and Troubleshooting
- Inspect `chrome://extensions` → *tana-clipper* → **Service Worker** logs for background errors.
- Use `chrome://inspect/#service-workers` to view runtime console output when clips fail.
- Reference [docs/demos/](./docs/demos/) for payload examples that should align with clipboard results.

Document any deviations, attach the clipboard output, and compare against [docs/tana-paste-docs.pdf](./docs/tana-paste-docs.pdf) before marking tests as passed.
