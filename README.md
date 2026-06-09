# Rustic Palm Listing Creator - Smart Crop + Edge Fill

Upload only:
- index.html
- README.md

No package.json. No src folder. No build command.

New export behavior:
- Smart Crop is the recommended default.
- If only a small crop is needed, it crops evenly from both sides or top/bottom.
- If too much would be cropped, it preserves the full artwork and fills the edges using a softened extension of the image.
- No more white side borders.
- Standard Crop remains available for full-bleed exports.
- Preserve Entire Image remains available for no-crop exports with soft fill.
