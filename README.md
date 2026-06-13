# Rustic Palm Listing Creator - Bundle Export Update

Upload only:
- index.html
- README.md

No package.json. No src folder. No build command.

New:
- Bundle Export tab
- Bundle name input
- Multi-file upload
- One bundle ZIP for all uploaded images
- ZIP organized by ratio folders, not by image
- Filenames are print-01, print-02, print-03, etc.
- Uses existing crop logic and does not stretch/distort images
- If one image/size fails, it skips that item and reports the error
- Keeps the existing single-image workflow
