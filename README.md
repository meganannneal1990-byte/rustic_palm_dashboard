# Rustic Palm Listing Creator - True Crop Anchor Fix

Upload only:
- index.html
- README.md

No package.json. No src folder. No build command.

Fix:
- Replaced crop math with true object-fit: cover logic.
- Center crop now crops evenly around the center.
- Added Crop Anchor:
  - Center crop
  - Keep top
  - Keep bottom
  - Keep left
  - Keep right
  - Manual sliders
- Use Fit / no crop to preserve full image with margins.
