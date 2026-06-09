# Rustic Palm Listing Creator - No Crop Smart Fit

Upload only:
- index.html
- README.md

No package.json. No src folder. No build command.

Fix:
- Smart Fit now compares actual image ratio to target print ratio.
- If ratios do not closely match, it uses no-crop fit with margins.
- This prevents bottom/top/side cropping during ZIP export.
- If you want full bleed cropping, manually choose Fill / crop to fit.
