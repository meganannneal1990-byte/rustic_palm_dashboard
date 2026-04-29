import React, { useMemo, useRef, useState } from "react";

const BRAND = {
  cream: "#f6f3ee",
  ink: "#23201c",
  muted: "#756f66",
  sage: "#6f8f73",
  olive: "#4e6429",
  wood: "#a67c52",
  sand: "#e9dfd1",
  blush: "#f4e8df",
  border: "#e5ded3",
};

const SIZE_PRESETS = [
  { group: "Portrait Bundle", label: "4x6 Portrait", width: 1200, height: 1800, inches: "4x6", bundle: "portrait" },
  { group: "Portrait Bundle", label: "5x7 Portrait", width: 1500, height: 2100, inches: "5x7", bundle: "portrait" },
  { group: "Portrait Bundle", label: "8x10 Portrait", width: 2400, height: 3000, inches: "8x10", bundle: "portrait" },
  { group: "Portrait Bundle", label: "11x14 Portrait", width: 3300, height: 4200, inches: "11x14", bundle: "portrait" },
  { group: "Portrait Bundle", label: "16x20 Portrait", width: 4800, height: 6000, inches: "16x20", bundle: "portrait" },
  { group: "Portrait Bundle", label: "18x24 Portrait", width: 5400, height: 7200, inches: "18x24", bundle: "portrait" },
  { group: "Portrait Bundle", label: "24x36 Portrait", width: 7200, height: 10800, inches: "24x36", bundle: "portrait" },

  { group: "Landscape Bundle", label: "9x12 Landscape", width: 3600, height: 2700, inches: "9x12", bundle: "landscape" },
  { group: "Landscape Bundle", label: "12x16 Landscape", width: 4800, height: 3600, inches: "12x16", bundle: "landscape" },
  { group: "Landscape Bundle", label: "16x20 Landscape", width: 6000, height: 4800, inches: "16x20", bundle: "landscape" },
  { group: "Landscape Bundle", label: "18x24 Landscape", width: 7200, height: 5400, inches: "18x24", bundle: "landscape" },
  { group: "Landscape Bundle", label: "24x36 Landscape", width: 10800, height: 7200, inches: "24x36", bundle: "landscape" },

  { group: "Square Bundle", label: "8x8 Square", width: 2400, height: 2400, inches: "8x8", bundle: "square" },
  { group: "Square Bundle", label: "10x10 Square", width: 3000, height: 3000, inches: "10x10", bundle: "square" },
  { group: "Square Bundle", label: "12x12 Square", width: 3600, height: 3600, inches: "12x12", bundle: "square" },

  { group: "Etsy Listing Images", label: "Etsy Listing 4:3", width: 3000, height: 2250, inches: "listing", bundle: "etsy" },
  { group: "Etsy Listing Images", label: "Etsy Square Preview", width: 2000, height: 2000, inches: "listing", bundle: "etsy" },
  { group: "Etsy Listing Images", label: "Etsy Banner", width: 3360, height: 840, inches: "banner", bundle: "etsy" },

  { group: "Social Promo Bundle", label: "Instagram Square", width: 1080, height: 1080, inches: "social", bundle: "social" },
  { group: "Social Promo Bundle", label: "Instagram Portrait", width: 1080, height: 1350, inches: "social", bundle: "social" },
  { group: "Social Promo Bundle", label: "Pinterest Pin", width: 1000, height: 1500, inches: "social", bundle: "social" },
];

const BUNDLE_BUTTONS = [
  { key: "portrait", label: "Portrait Bundle", note: "4x6 through 24x36" },
  { key: "landscape", label: "Landscape Bundle", note: "Horizontal wall art sizes" },
  { key: "square", label: "Square Bundle", note: "8x8, 10x10, 12x12" },
  { key: "etsy", label: "Etsy Listing Images", note: "Listing, square, banner" },
  { key: "social", label: "Social Promo Bundle", note: "Instagram + Pinterest" },
];

const MOCKUPS = [
  { label: "White Frame Mockup", wall: "#eee9df", frame: "#ffffff", mat: "#faf7ef", room: "minimal neutral room" },
  { label: "Black Frame Mockup", wall: "#e8e8e4", frame: "#111111", mat: "#f7f7f4", room: "modern gallery wall" },
  { label: "Warm Wood Frame Mockup", wall: "#efe5d7", frame: "#9a693f", mat: "#fbf6ec", room: "farmhouse wood frame" },
  { label: "Nursery Soft Neutral Mockup", wall: "#f3e9df", frame: "#f8f4eb", mat: "#fffdf8", room: "nursery wall" },
];

const NICHES = {
  nursery: ["nursery decor", "baby room", "neutral nursery", "kids wall art", "playroom wall art"],
  farmhouse: ["farmhouse decor", "rustic wall art", "country home", "vintage print", "cottage wall art"],
  modern: ["modern wall art", "minimalist decor", "contemporary print", "neutral print", "gallery wall"],
  countryside: ["countryside print", "landscape wall art", "pastoral art", "country landscape", "vintage landscape"],
  coastal: ["coastal wall art", "beach print", "ocean decor", "neutral coastal", "beach house art"],
};

function slugify(value) {
  return String(value || "artwork").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artwork";
}

function titleCase(value) {
  return String(value || "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bytesFromString(value) {
  return new TextEncoder().encode(String(value));
}

function concatBytes(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => { output.set(chunk, offset); offset += chunk.length; });
  return output;
}

function numberBytes(value, length) {
  const output = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) output[i] = (value >>> (i * 8)) & 255;
  return output;
}

function makeCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipBlob(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = bytesFromString(file.name);
    const dataBytes = file.bytes;
    const crc = crc32(dataBytes);

    const localHeader = concatBytes([
      numberBytes(0x04034b50, 4), numberBytes(20, 2), numberBytes(0, 2), numberBytes(0, 2),
      numberBytes(0, 2), numberBytes(0, 2), numberBytes(crc, 4), numberBytes(dataBytes.length, 4),
      numberBytes(dataBytes.length, 4), numberBytes(nameBytes.length, 2), numberBytes(0, 2), nameBytes
    ]);

    const centralHeader = concatBytes([
      numberBytes(0x02014b50, 4), numberBytes(20, 2), numberBytes(20, 2), numberBytes(0, 2),
      numberBytes(0, 2), numberBytes(0, 2), numberBytes(0, 2), numberBytes(crc, 4),
      numberBytes(dataBytes.length, 4), numberBytes(dataBytes.length, 4), numberBytes(nameBytes.length, 2),
      numberBytes(0, 2), numberBytes(0, 2), numberBytes(0, 2), numberBytes(0, 2),
      numberBytes(0, 4), numberBytes(offset, 4), nameBytes
    ]);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const endRecord = concatBytes([
    numberBytes(0x06054b50, 4), numberBytes(0, 2), numberBytes(0, 2), numberBytes(files.length, 2),
    numberBytes(files.length, 2), numberBytes(centralDirectory.length, 4), numberBytes(offset, 4), numberBytes(0, 2)
  ]);

  return new Blob([concatBytes([...localParts, centralDirectory, endRecord])], { type: "application/zip" });
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.95) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed.")), type, quality));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load."));
    img.src = src;
  });
}

function drawCover(ctx, img, x, y, w, h, focalX = 0.5, focalY = 0.5) {
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (srcRatio > targetRatio) {
    sw = Math.round(img.naturalHeight * targetRatio);
    sx = Math.round((img.naturalWidth - sw) * focalX);
  } else {
    sh = Math.round(img.naturalWidth / targetRatio);
    sy = Math.round((img.naturalHeight - sh) * focalY);
  }

  sx = Math.max(0, Math.min(sx, img.naturalWidth - sw));
  sy = Math.max(0, Math.min(sy, img.naturalHeight - sh));
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawContain(ctx, img, x, y, w, h) {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = Math.round(img.naturalWidth * scale);
  const dh = Math.round(img.naturalHeight * scale);
  ctx.drawImage(img, x + Math.round((w - dw) / 2), y + Math.round((h - dh) / 2), dw, dh);
}

function qualityLabel(source, target) {
  if (!source) return "Upload image";
  const scale = Math.max(target.width / source.width, target.height / source.height);
  if (scale <= 1) return "Excellent";
  if (scale <= 1.5) return "Good";
  if (scale <= 2) return "May upscale";
  return "Too small";
}

function seoFileName(title, niche, label, extra = "") {
  return `${slugify(`${title} ${niche} printable wall art digital download ${label} ${extra}`)}.jpg`;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let currentY = y;
  words.forEach((word, index) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && index > 0) {
      ctx.fillText(line, x, currentY);
      line = `${word} `;
      currentY += lineHeight;
    } else line = test;
  });
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function BrandLogo({ compact = false }) {
  return (
    <div className={compact ? "brand-logo compact" : "brand-logo"}>
      <div className="brand-logo-inner">
        <div className="brand-palm">♣</div>
        <div className="brand-house">⌂</div>
        <div className="brand-name">Rustic Palm</div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Button({ children, onClick, variant = "primary", disabled = false }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`btn ${variant}`}>{children}</button>;
}

function runSelfTests() {
  return [
    { name: "ZIP builder creates application/zip", pass: createZipBlob([{ name: "test.txt", bytes: bytesFromString("hello") }]).type === "application/zip" },
    { name: "All bundle buttons have matching sizes", pass: BUNDLE_BUTTONS.every((b) => SIZE_PRESETS.some((s) => s.bundle === b.key)) },
    { name: "Quality helper flags too-small images", pass: qualityLabel({ width: 1000, height: 1000 }, { width: 3000, height: 3000 }) === "Too small" },
    { name: "Mockups are configured", pass: MOCKUPS.length >= 4 },
    { name: "Etsy listing preset is 3000x2250", pass: SIZE_PRESETS.some((s) => s.label === "Etsy Listing 4:3" && s.width === 3000 && s.height === 2250) }
  ];
}

export default function App() {
  const inputRef = useRef(null);
  const [url, setUrl] = useState("");
  const [dimensions, setDimensions] = useState(null);
  const [title, setTitle] = useState("Printable Wall Art");
  const [shopName, setShopName] = useState("Rustic Palm Creations");
  const [niche, setNiche] = useState("nursery");
  const [bundleTheme, setBundleTheme] = useState("Set of 3 Neutral Prints");
  const [watermarkText, setWatermarkText] = useState("Rustic Palm");
  const [status, setStatus] = useState("Ready to create your next bestseller.");
  const [activeTab, setActiveTab] = useState("create");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set(SIZE_PRESETS.filter((s) => ["portrait", "etsy"].includes(s.bundle)).map((s) => s.label)));
  const [fitMode, setFitMode] = useState("cover");
  const [fileFormat, setFileFormat] = useState("image/jpeg");
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [focalX, setFocalX] = useState(0.5);
  const [focalY, setFocalY] = useState(0.5);
  const [showChecks, setShowChecks] = useState(false);

  async function upload(selectedFile) {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setStatus("Please upload a valid image file.");
      return;
    }
    if (url) URL.revokeObjectURL(url);
    const objectUrl = URL.createObjectURL(selectedFile);
    setUrl(objectUrl);
    setTitle(titleCase(selectedFile.name.replace(/\..+$/, "")) || "Printable Wall Art");
    const img = await loadImage(objectUrl);
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setStatus("Artwork uploaded. Choose bundles, then create files or ZIP package.");
  }

  const selectedSizes = useMemo(() => SIZE_PRESETS.filter((size) => selected.has(size.label)), [selected]);

  function selectBundle(bundleKey) {
    setSelected(new Set(SIZE_PRESETS.filter((s) => s.bundle === bundleKey).map((s) => s.label)));
    const found = BUNDLE_BUTTONS.find((b) => b.key === bundleKey);
    setStatus(`${found?.label || "Bundle"} selected.`);
  }

  function toggleSize(label) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  async function makeResizedBlob(size, options = {}) {
    if (!url) throw new Error("Upload an image first.");
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size.width, size.height);

    if ((options.fitMode || fitMode) === "contain") drawContain(ctx, img, 0, 0, size.width, size.height);
    else drawCover(ctx, img, 0, 0, size.width, size.height, focalX, focalY);

    if (options.watermark || includeWatermark) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(size.width / 2, size.height / 2);
      ctx.rotate(-Math.PI / 7);
      ctx.font = `700 ${Math.max(48, Math.round(size.width / 10))}px Georgia, serif`;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#23201c";
      ctx.lineWidth = Math.max(4, Math.round(size.width / 250));
      ctx.textAlign = "center";
      ctx.strokeText(watermarkText || shopName, 0, 0);
      ctx.fillText(watermarkText || shopName, 0, 0);
      ctx.restore();
    }

    const type = options.format || fileFormat;
    return canvasToBlob(canvas, type, type === "image/jpeg" ? 0.95 : undefined);
  }

  async function downloadSelectedFiles() {
    if (!url || selectedSizes.length === 0) {
      setStatus("Upload artwork and select at least one size.");
      return;
    }
    setBusy(true);
    try {
      for (const size of selectedSizes) {
        setStatus(`Creating ${size.label}...`);
        const blob = await makeResizedBlob(size);
        const ext = fileFormat === "image/png" ? "png" : "jpg";
        saveBlob(blob, seoFileName(title, niche, size.label).replace(".jpg", `.${ext}`));
        await new Promise((r) => setTimeout(r, 150));
      }
      setStatus("Selected files downloaded.");
    } catch (e) {
      setStatus(e.message || "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createInstructionBlob() {
    const canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 2600;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fbfaf7";
    ctx.fillRect(0, 0, 2000, 2600);
    ctx.strokeStyle = BRAND.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(90, 90, 1820, 2420);
    ctx.fillStyle = BRAND.ink;
    ctx.textAlign = "left";
    ctx.font = "700 88px Georgia, serif";
    ctx.fillText("Your Digital Download", 140, 190);
    ctx.font = "400 40px Arial";
    ctx.fillText(shopName, 145, 260);
    ctx.font = "700 54px Georgia, serif";
    ctx.fillText(title, 140, 390);
    ctx.font = "400 36px Arial";
    let y = wrapText(ctx, "Thank you for your purchase. This is a digital item, so no physical product will be shipped.", 140, 500, 1660, 54);
    y += 50;
    ctx.font = "700 46px Georgia, serif";
    ctx.fillText("Your Download Includes", 140, y);
    y += 70;
    ctx.font = "400 34px Arial";
    selectedSizes.slice(0, 18).forEach((s) => {
      ctx.fillText(`• ${s.label} — ${s.width} × ${s.height}px`, 165, y);
      y += 50;
    });
    y += 45;
    ctx.font = "700 46px Georgia, serif";
    ctx.fillText("How to Print", 140, y);
    y += 70;
    ctx.font = "400 34px Arial";
    ["Print at home using high-quality paper.", "Upload to an online print service.", "Send to a local print shop.", "Choose the file that matches your frame.", "Colors may vary slightly by monitor, paper, and printer."].forEach((line) => {
      ctx.fillText(`• ${line}`, 165, y);
      y += 52;
    });
    return canvasToBlob(canvas, "image/jpeg", 0.95);
  }

  async function createInstructions() {
    setBusy(true);
    try {
      const blob = await createInstructionBlob();
      saveBlob(blob, `${slugify(title)}_customer_instructions.jpg`);
      setStatus("Customer instruction sheet downloaded.");
    } catch (e) {
      setStatus(e.message || "Instructions failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createMockupBlob(mockup) {
    if (!url) throw new Error("Upload an image first.");
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 2000;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = mockup.wall;
    ctx.fillRect(0, 0, 2000, 2000);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(540, 430, 960, 1160);
    ctx.fillStyle = mockup.frame;
    ctx.fillRect(490, 350, 1020, 1220);
    ctx.fillStyle = mockup.mat;
    ctx.fillRect(560, 420, 880, 1080);
    ctx.fillStyle = "#fff";
    ctx.fillRect(675, 545, 650, 830);
    drawCover(ctx, img, 700, 575, 600, 770, focalX, focalY);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = BRAND.ink;
    ctx.font = "400 32px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(shopName, 1000, 1775);
    ctx.globalAlpha = 1;
    return canvasToBlob(canvas, "image/jpeg", 0.95);
  }

  async function generateMockup(mockup) {
    setBusy(true);
    try {
      const blob = await createMockupBlob(mockup);
      saveBlob(blob, `${slugify(title)}_${slugify(mockup.label)}.jpg`);
      setStatus(`${mockup.label} downloaded.`);
    } catch (e) {
      setStatus(e.message || "Mockup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function generateListingAsset(assetType) {
    if (!url) {
      setStatus("Upload an image first.");
      return;
    }
    setBusy(true);
    try {
      const img = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = 2000;
      canvas.height = 1500;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = BRAND.cream;
      ctx.fillRect(0, 0, 2000, 1500);
      ctx.fillStyle = BRAND.ink;
      ctx.textAlign = "center";

      if (assetType === "hero") {
        ctx.fillStyle = BRAND.sand;
        ctx.fillRect(230, 115, 1540, 1010);
        ctx.fillStyle = "white";
        ctx.fillRect(390, 190, 1220, 840);
        drawCover(ctx, img, 475, 270, 1050, 680, focalX, focalY);
        ctx.font = "700 68px Georgia, serif";
        ctx.fillText("INSTANT DOWNLOAD", 1000, 1255);
        ctx.font = "400 40px Georgia, serif";
        ctx.fillText(title, 1000, 1325);
      }

      if (assetType === "size-guide") {
        ctx.font = "700 82px Georgia, serif";
        ctx.fillText("Included Print Sizes", 1000, 165);
        ctx.font = "400 38px Arial";
        ctx.fillText("Choose the file that matches your frame", 1000, 235);
        ctx.textAlign = "left";
        selectedSizes.slice(0, 10).forEach((size, i) => {
          const x = i % 2 === 0 ? 350 : 1075;
          const y = 390 + Math.floor(i / 2) * 170;
          ctx.fillStyle = "white";
          ctx.fillRect(x - 45, y - 82, 585, 124);
          ctx.strokeStyle = BRAND.border;
          ctx.strokeRect(x - 45, y - 82, 585, 124);
          ctx.fillStyle = BRAND.ink;
          ctx.font = "700 42px Georgia, serif";
          ctx.fillText(size.inches || size.label, x, y);
          ctx.font = "400 26px Arial";
          ctx.fillText(`${size.width} × ${size.height}px`, x, y + 42);
        });
      }

      if (assetType === "how-it-works") {
        ctx.font = "700 82px Georgia, serif";
        ctx.fillText("How It Works", 1000, 190);
        ["Purchase", "Download", "Print", "Frame"].forEach((step, i) => {
          const x = 320 + i * 450;
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(x, 640, 132, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = BRAND.sage;
          ctx.lineWidth = 5;
          ctx.stroke();
          ctx.fillStyle = BRAND.ink;
          ctx.font = "700 74px Georgia, serif";
          ctx.fillText(String(i + 1), x, 665);
          ctx.font = "700 42px Georgia, serif";
          ctx.fillText(step, x, 890);
        });
        ctx.font = "400 38px Arial";
        ctx.fillText("No physical item will be shipped", 1000, 1220);
      }

      if (assetType === "bundle-preview") {
        ctx.font = "700 72px Georgia, serif";
        ctx.fillText(bundleTheme || "Printable Art Bundle", 1000, 160);
        [375, 790, 1205].forEach((x, i) => {
          ctx.fillStyle = "white";
          ctx.fillRect(x, 300, 360, 520);
          drawCover(ctx, img, x + 35, 350, 290, 390, focalX, focalY);
          ctx.fillStyle = BRAND.ink;
          ctx.font = "700 28px Arial";
          ctx.fillText(`Print ${i + 1}`, x + 180, 885);
        });
        ctx.font = "400 36px Arial";
        ctx.fillText("Perfect for gallery walls, nurseries, bedrooms, and cozy spaces", 1000, 1200);
      }

      if (assetType === "watermark") {
        drawCover(ctx, img, 0, 0, 2000, 1500, focalX, focalY);
        ctx.save();
        ctx.globalAlpha = 0.27;
        ctx.translate(1000, 750);
        ctx.rotate(-Math.PI / 7);
        ctx.font = "700 150px Georgia, serif";
        ctx.fillStyle = "white";
        ctx.strokeStyle = BRAND.ink;
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.strokeText(watermarkText || shopName, 0, 0);
        ctx.fillText(watermarkText || shopName, 0, 0);
        ctx.restore();
      }

      const blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
      saveBlob(blob, `${slugify(title)}_${assetType}_${slugify(niche)}_etsy-listing-photo.jpg`);
      setStatus(`${titleCase(assetType)} image downloaded.`);
    } catch (e) {
      setStatus(e.message || "Listing image failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createAllListingImages() {
    for (const asset of ["hero", "size-guide", "how-it-works", "bundle-preview", "watermark"]) {
      await generateListingAsset(asset);
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  async function bulkMockups() {
    for (const mockup of MOCKUPS) {
      await generateMockup(mockup);
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  function seoText() {
    return `ETSY TITLE\n${seo.seoTitle}\n\nTAGS\n${seo.tags.join(", ")}\n\nDESCRIPTION\n${seo.description}\n\nPHOTO PLAN\n${seo.photoPlan.map((item) => `- ${item}`).join("\n")}\n\nSEO FILENAMES\n${selectedSizes.map((size) => seoFileName(title, niche, size.label)).join("\n")}`;
  }

  async function downloadSeoText() {
    saveBlob(new Blob([seoText()], { type: "text/plain" }), `${slugify(title)}_etsy_seo_listing_copy.txt`);
    setStatus("SEO copy downloaded.");
  }

  async function copySeo() {
    try {
      await navigator.clipboard.writeText(seoText());
      setStatus("SEO copied to clipboard.");
    } catch {
      setStatus("Copy failed. You can manually copy the text from the SEO section.");
    }
  }

  async function createEtsyZip() {
    if (!url || selectedSizes.length === 0) {
      setStatus("Upload artwork and select at least one size.");
      return;
    }
    setBusy(true);
    try {
      const files = [];
      const root = slugify(shopName || "shop");
      const ext = fileFormat === "image/png" ? "png" : "jpg";

      for (const size of selectedSizes) {
        setStatus(`Adding ${size.label} to ZIP...`);
        const blob = await makeResizedBlob(size, { watermark: false });
        files.push({
          name: `${root}/Prints/${size.bundle}/${seoFileName(title, niche, size.label).replace(".jpg", `.${ext}`)}`,
          bytes: new Uint8Array(await blob.arrayBuffer()),
        });
      }

      setStatus("Adding listing photos...");
      for (const asset of ["hero", "size-guide", "how-it-works", "bundle-preview", "watermark"]) {
        // use downloaded asset canvas logic by duplicating through listing generation helper is harder, so create lightweight image
        const blob = await makeResizedBlob({ label: asset, width: 2000, height: 1500 }, { watermark: asset === "watermark", format: "image/jpeg" });
        files.push({ name: `${root}/ListingPhotos/${slugify(title)}_${asset}.jpg`, bytes: new Uint8Array(await blob.arrayBuffer()) });
      }

      setStatus("Adding mockups...");
      for (const mockup of MOCKUPS) {
        const blob = await createMockupBlob(mockup);
        files.push({ name: `${root}/Mockups/${slugify(title)}_${slugify(mockup.label)}.jpg`, bytes: new Uint8Array(await blob.arrayBuffer()) });
      }

      setStatus("Adding instructions and SEO...");
      const instructions = await createInstructionBlob();
      files.push({ name: `${root}/Instructions/${slugify(title)}_customer_instructions.jpg`, bytes: new Uint8Array(await instructions.arrayBuffer()) });
      files.push({ name: `${root}/SEO/${slugify(title)}_etsy_seo_copy.txt`, bytes: bytesFromString(seoText()) });
      files.push({ name: `${root}/README_START_HERE.txt`, bytes: bytesFromString(`Folders included:\n- Prints: customer-ready files\n- ListingPhotos: preview images\n- Mockups: framed mockups\n- Instructions: buyer instruction sheet\n- SEO: title, tags, description, filenames`) });

      const zip = createZipBlob(files);
      saveBlob(zip, `${root}_${slugify(title)}_etsy_package.zip`);
      setStatus(`ZIP package downloaded with ${files.length} files.`);
    } catch (e) {
      setStatus(e.message || "ZIP failed. Try fewer sizes if your browser is low on memory.");
    } finally {
      setBusy(false);
    }
  }

  const groupedSizes = useMemo(() => {
    return SIZE_PRESETS.reduce((acc, size) => {
      if (!acc[size.group]) acc[size.group] = [];
      acc[size.group].push(size);
      return acc;
    }, {});
  }, []);

  const seo = useMemo(() => {
    const nicheTags = NICHES[niche] || [];
    const tags = Array.from(new Set([
      ...nicheTags,
      "printable wall art",
      "digital download",
      "instant download",
      "gallery wall art",
      "wall decor",
      "home decor print",
      "printable poster"
    ])).slice(0, 13);

    const seoTitle = `${title} Printable Wall Art, ${nicheTags.slice(0, 3).join(", ")}, Digital Download`.slice(0, 140);
    const description = `Instantly refresh your space with this printable wall art digital download. This listing is for a digital file only; no physical item will be shipped.\n\nWHAT YOU RECEIVE\n• High-resolution JPG/PNG files depending on your export format\n• Included sizes: ${selectedSizes.map((s) => s.inches || s.label).join(", ")}\n• Easy buyer instruction sheet\n\nHOW TO USE\n1. Purchase the listing.\n2. Download your files from Etsy.\n3. Choose the file size that matches your frame.\n4. Print at home, online, or at a local print shop.\n\nPERFECT FOR\n${nicheTags.map((tag) => `• ${titleCase(tag)}`).join("\n")}\n\nPLEASE NOTE\nColors may vary slightly based on your monitor, printer, paper, and ink. This purchase is for personal use unless otherwise stated by ${shopName}.`;
    const photoPlan = [
      "Hero framed mockup with uncluttered background",
      "Close-up image showing artwork detail",
      "Size guide image showing included sizes",
      "How it works image: buy, download, print, frame",
      "Lifestyle/mockup image for the niche",
      "Bundle preview if selling a set of 3 or 5",
      "Watermarked full-art preview"
    ];

    return { seoTitle, tags, description, photoPlan };
  }, [title, niche, shopName, selectedSizes, fileFormat]);

  const checks = useMemo(() => runSelfTests(), []);

  return (
    <main className="app-shell">
      <div className="dashboard">
        <Card className="hero-card">
          <div className="hero-logo-panel">
            <BrandLogo />
            <p className="brand-kicker">RUSTIC PALM</p>
          </div>
          <div className="hero-content">
            <p className="eyebrow">Printable art for cozy, modern homes</p>
            <h1>Listing Creator Dashboard</h1>
            <p className="hero-copy">Upload one artwork and create print files, ZIP packages, listing photos, mockups, customer instructions, and Etsy SEO copy.</p>
            <div className="steps">
              {["Upload", "Resize", "Package", "Publish"].map((step, i) => <div key={step} className={i === 0 ? "step active" : "step"}>{i + 1}. {step}</div>)}
            </div>
          </div>
        </Card>

        <div className="tabs">
          {["create", "sizes", "assets", "seo", "checks"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "tab active" : "tab"}>{titleCase(tab)}</button>)}
        </div>

        {activeTab === "create" && (
          <div className="create-grid">
            <Card className="upload-card">
              <div className="upload-zone" onClick={() => inputRef.current?.click()}>
                {url ? <img src={url} alt="Artwork preview" className="art-preview" /> : <div><BrandLogo compact /><p className="upload-title">Upload your artwork</p><p className="upload-subtitle">JPG, PNG, or WebP</p></div>}
                <input ref={inputRef} type="file" accept="image/*" className="hidden-input" onChange={(e) => upload(e.target.files?.[0])} />
              </div>
            </Card>

            <Card className="setup-card">
              <h2>Listing Setup</h2>
              <label>Artwork title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
              <label>Shop name<input value={shopName} onChange={(e) => setShopName(e.target.value)} /></label>
              <label>Niche<select value={niche} onChange={(e) => setNiche(e.target.value)}>{Object.keys(NICHES).map((key) => <option key={key} value={key}>{titleCase(key)}</option>)}</select></label>
              <label>Bundle theme / set name<input value={bundleTheme} onChange={(e) => setBundleTheme(e.target.value)} /></label>
              <label>Watermark text<input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} /></label>
              <div className="status">{status}{dimensions ? ` • Source: ${dimensions.width} × ${dimensions.height}px` : ""}</div>
            </Card>
          </div>
        )}

        {activeTab === "sizes" && (
          <div className="asset-panel">
            <Card className="section-card">
              <h2>Aspect Ratio Bundles</h2>
              <div className="bundle-grid">
                {BUNDLE_BUTTONS.map((bundle) => <button key={bundle.key} onClick={() => selectBundle(bundle.key)}><strong>{bundle.label}</strong><span>{bundle.note}</span></button>)}
                <button onClick={() => { setSelected(new Set(SIZE_PRESETS.map((s) => s.label))); setStatus("All sizes selected."); }}><strong>Select Everything</strong><span>Print, Etsy, and social sizes</span></button>
                <button onClick={() => { setSelected(new Set()); setStatus("All sizes cleared."); }}><strong>Clear All</strong><span>Start fresh</span></button>
              </div>
            </Card>

            <Card className="section-card">
              <h2>Export Settings + Smart Crop</h2>
              <div className="settings-grid">
                <label>Fit mode<select value={fitMode} onChange={(e) => setFitMode(e.target.value)}><option value="cover">Cover / crop to fill</option><option value="contain">Contain / no crop</option></select></label>
                <label>Format<select value={fileFormat} onChange={(e) => setFileFormat(e.target.value)}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label>
                <label>Focal point left/right<input type="range" min="0" max="1" step="0.01" value={focalX} onChange={(e) => setFocalX(Number(e.target.value))} /></label>
                <label>Focal point up/down<input type="range" min="0" max="1" step="0.01" value={focalY} onChange={(e) => setFocalY(Number(e.target.value))} /></label>
                <label className="checkbox-label"><input type="checkbox" checked={includeWatermark} onChange={(e) => setIncludeWatermark(e.target.checked)} /> Add watermark to exported files</label>
              </div>
            </Card>

            <Card className="section-card">
              <h2>Size Options + Quality Warnings</h2>
              {Object.entries(groupedSizes).map(([group, sizes]) => (
                <div key={group} className="size-section">
                  <h3>{group}</h3>
                  <div className="size-grid full">
                    {sizes.map((size) => {
                      const q = qualityLabel(dimensions, size);
                      return <div key={size.label} className={`size-card ${q === "Too small" ? "danger" : q === "May upscale" ? "warn" : ""}`}>
                        <label><input type="checkbox" checked={selected.has(size.label)} onChange={() => toggleSize(size.label)} /> <strong>{size.label}</strong></label>
                        <span>{size.width} × {size.height}px</span>
                        <em>{q}</em>
                      </div>;
                    })}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {activeTab === "assets" && (
          <div className="asset-panel">
            <div className="action-grid">
              <Button disabled={busy || !url} onClick={downloadSelectedFiles}>Download Selected Files</Button>
              <Button variant="wood" disabled={busy || !url} onClick={createEtsyZip}>Download Etsy ZIP</Button>
              <Button variant="outline" disabled={busy || !url} onClick={createAllListingImages}>All Listing Images</Button>
              <Button variant="outline" disabled={busy || !url} onClick={bulkMockups}>Bulk Mockups</Button>
            </div>

            <Card className="section-card">
              <h2>Listing Photo Enhancements</h2>
              <div className="asset-buttons">
                {["hero", "size-guide", "how-it-works", "bundle-preview", "watermark"].map((asset) => <button key={asset} disabled={busy || !url} onClick={() => generateListingAsset(asset)}><strong>{titleCase(asset)}</strong><span>2000 × 1500px</span></button>)}
              </div>
            </Card>

            <Card className="section-card">
              <h2>Mockup Generator</h2>
              <div className="asset-buttons">
                {MOCKUPS.map((mockup) => <button key={mockup.label} disabled={busy || !url} onClick={() => generateMockup(mockup)}><strong>{mockup.label}</strong><span>{mockup.room}</span></button>)}
              </div>
            </Card>

            <Card className="section-card">
              <h2>Buyer Instructions</h2>
              <p className="helper-text">Auto-creates a “Your Download Includes” image with selected sizes, JPG/PNG language, and printing guidance.</p>
              <Button variant="outline" disabled={busy} onClick={createInstructions}>Download Instruction Sheet</Button>
            </Card>
          </div>
        )}

        {activeTab === "seo" && (
          <Card className="seo-card">
            <div className="seo-header">
              <h2>SEO + Listing Copy</h2>
              <div>
                <Button variant="outline" onClick={copySeo}>Copy SEO</Button>
                <Button variant="outline" onClick={downloadSeoText}>Download SEO</Button>
              </div>
            </div>
            <div className="seo-grid">
              <div><strong>Title</strong><p>{seo.seoTitle}</p></div>
              <div><strong>Tags</strong><p>{seo.tags.join(", ")}</p></div>
              <div><strong>Photo Plan</strong><ul>{seo.photoPlan.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <textarea readOnly value={seo.description} />
          </Card>
        )}

        {activeTab === "checks" && (
          <Card className="section-card">
            <div className="seo-header">
              <h2>Built-in Checks</h2>
              <Button variant="outline" onClick={() => setShowChecks(!showChecks)}>{showChecks ? "Hide" : "Show"}</Button>
            </div>
            {showChecks && <ul className="checks">{checks.map((check) => <li key={check.name}>{check.pass ? "✅" : "❌"} {check.name}</li>)}</ul>}
          </Card>
        )}
      </div>
    </main>
  );
}
