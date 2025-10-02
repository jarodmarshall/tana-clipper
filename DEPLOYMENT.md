# Deployment Guide

## Prerequisites
- Update `manifest.json` version.
- Run `npm install` if dependencies changed.
- Ensure icons exist in `public/icons/` and match Chrome store requirements (16, 48, 128px).

## Build and Package
1. Run `npm run build` to produce the latest files in `dist/`.
2. Confirm the build contains `manifest.json`, compiled background/content scripts, and assets.
3. From the project root, create a release archive:
   - `cd dist`
   - `zip -r ../tana-clipper.zip *`
4. The ZIP file in the project root (`tana-clipper.zip`) is ready for upload.

## Chrome Web Store Upload
1. Sign in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Click **New Item** or select the existing listing to update.
3. Upload the `tana-clipper.zip` file.
4. Provide the item details:
   - Title, short description, and full description referencing the Tana Paste workflow.
   - Screenshots (Chrome recommends 1280x800) showing context menu capture and Tana results.
   - Icon assets generated from `public/icons/`.
5. Complete the privacy, distribution, and contact sections.
6. Submit for review. Track approval status from the dashboard.

## Post-Submission
- Tag the repo release (e.g., `git tag vX.Y.Z`) matching the manifest version.
- Update `DEPLOYMENT.md` with any new review requirements or assets used.
- Announce the release with links to README, [docs/tana-paste-docs.pdf](./docs/tana-paste-docs.pdf), and [docs/demos/](./docs/demos/) for integrators.
