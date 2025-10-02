# tana-clipper

Chrome extension for capturing web content into the [Tana Paste](https://tana.inc) format. Use this repo to develop, test, and package the Manifest V3 extension that powers the right-click “Clip to Tana” workflow.

- **Tana Paste spec:** [docs/tana-paste-docs.pdf](./docs/tana-paste-docs.pdf)
- **Reference demos:** [docs/demos/](./docs/demos/)

---

## Installation
1. Run `npm install` if you have not already built the project.
2. Build the extension bundle with `npm run build`. Output lands in `dist/`.
3. In Chrome, open `chrome://extensions`, enable **Developer mode**, then choose **Load unpacked**.
4. Select the `dist/` directory generated in step 2. The extension appears in your extension list.

## Usage
1. Navigate to any web page and select the text, image, or element you want to clip.
2. Right-click the selection and choose **Clip to Tana** from the context menu.
3. The background script formats the payload as Tana Paste and copies it to your clipboard.
4. Paste inside Tana; use the spec and [docs/demos/](./docs/demos/) implementations as references for expected structure and metadata.

## Testing
- Walk through the manual testing checklist in [TESTING.md](./TESTING.md).
- At minimum, verify the context menu appears, the clipboard contains Tana Paste markup, and failures surface in the console.
- Consult the [Tana Paste spec](./docs/tana-paste-docs.pdf) to confirm the payload matches required fields and metadata.

## Contributing
Issues and pull requests are welcome. Please include reproduction steps or links to failing demos where possible so QA can validate against [TESTING.md](./TESTING.md).

For packaging or store distribution, follow [DEPLOYMENT.md](./DEPLOYMENT.md).
