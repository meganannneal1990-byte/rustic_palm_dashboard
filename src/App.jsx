import React, { useMemo, useRef, useState } from "react";

const BRAND = {
  cream: "#f6f3ee",
  ink: "#23201c",
  muted: "#756f66",
  sage: "#6f8f73",
  olive: "#4e6429",
  wood: "#a67c52",
  sand: "#e9dfd1",
  border: "#e5ded3"
};

const NICHES = {
  nursery: ["nursery decor", "baby room", "neutral nursery", "kids wall art", "playroom wall art"],
  farmhouse: ["farmhouse decor", "rustic wall art", "country home", "vintage print", "cottage wall art"],
  modern: ["modern wall art", "minimalist decor", "contemporary print", "neutral print", "gallery wall"],
  countryside: ["countryside print", "landscape wall art", "pastoral art", "country landscape", "vintage landscape"],
  coastal: ["coastal wall art", "beach print", "ocean decor", "neutral coastal", "beach house art"]
};

const PRINT_SIZES = [
  { label: "8x10", width: 2400, height: 3000 },
  { label: "11x14", width: 3300, height: 4200 },
  { label: "16x20", width: 4800, height: 6000 },
  { label: "18x24", width: 5400, height: 7200 },
  { label: "24x36", width: 7200, height: 10800 }
];

const LISTING_ASSETS = [
  { label: "Hero Listing Image", type: "hero" },
  { label: "Size Guide", type: "size-guide" },
  { label: "How It Works", type: "how-it-works" },
  { label: "Bundle Preview", type: "bundle-preview" },
  { label: "Watermarked Preview", type: "watermark" }
];

function slugify(value) {
  return String(value || "artwork").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artwork";
}

function titleCase(value) {
  return String(value || "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (l) => l.toUpperCase());
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 700);
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

function drawCover(ctx, img, x, y, w, h) {
  const srcRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (srcRatio > targetRatio) {
    sw = Math.round(img.naturalHeight * targetRatio);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(img.naturalWidth / targetRatio);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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
    } else {
      line = test;
    }
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
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`btn ${variant}`}>
      {children}
    </button>
  );
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
    setStatus("Artwork uploaded. Start with Create Files, then move through the dashboard.");
  }

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
    const description = `Instantly refresh your space with this printable wall art digital download. This listing is for a digital file only; no physical item will be shipped.\n\nWHAT YOU RECEIVE\n• High-resolution printable JPG files\n• Common print sizes: ${PRINT_SIZES.map((s) => s.label).join(", ")}\n• Easy buyer instruction sheet\n\nHOW TO USE\n1. Purchase the listing.\n2. Download your files from Etsy.\n3. Choose the file size that matches your frame.\n4. Print at home, online, or at a local print shop.\n\nPERFECT FOR\n${nicheTags.map((tag) => `• ${titleCase(tag)}`).join("\n")}\n\nPLEASE NOTE\nColors may vary slightly based on your monitor, printer, paper, and ink. This purchase is for personal use unless otherwise stated by ${shopName}.`;
    const photoPlan = [
      "Hero framed mockup with uncluttered background",
      "Close-up image showing artwork detail",
      "Size guide image showing included sizes",
      "How it works image: buy, download, print, frame",
      "Lifestyle/mockup image for the niche",
      "Bundle preview if selling a set of 3 or 5"
    ];
    return { seoTitle, tags, description, photoPlan };
  }, [title, niche, shopName]);

  async function createPrintBundle() {
    if (!url) { setStatus("Upload an image first."); return; }
    setBusy(true);
    setStatus("Creating SEO-named customer print files...");
    try {
      const img = await loadImage(url);
      for (const size of PRINT_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        drawCover(ctx, img, 0, 0, size.width, size.height);
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
        saveBlob(blob, seoFileName(title, niche, size.label));
        await new Promise((r) => setTimeout(r, 150));
      }
      setStatus("Print bundle downloaded. Check your Downloads folder.");
    } catch (e) {
      setStatus(e.message || "Bundle failed.");
    } finally {
      setBusy(false);
    }
  }

  async function generateListingAsset(assetType) {
    if (!url) { setStatus("Upload an image first."); return; }
    setBusy(true);
    setStatus(`Generating ${titleCase(assetType)}...`);
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
        drawCover(ctx, img, 475, 270, 1050, 680);
        ctx.font = "700 68px Georgia, serif";
        ctx.fillStyle = BRAND.ink;
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
        PRINT_SIZES.forEach((size, i) => {
          const x = i % 2 === 0 ? 360 : 1080;
          const y = 425 + Math.floor(i / 2) * 172;
          ctx.fillStyle = "white";
          ctx.fillRect(x - 45, y - 82, 565, 124);
          ctx.strokeStyle = BRAND.border;
          ctx.strokeRect(x - 45, y - 82, 565, 124);
          ctx.fillStyle = BRAND.ink;
          ctx.font = "700 46px Georgia, serif";
          ctx.fillText(size.label, x, y);
          ctx.font = "400 28px Arial";
          ctx.fillText(`${size.width} × ${size.height}px`, x, y + 43);
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
          drawCover(ctx, img, x + 35, 350, 290, 390);
          ctx.fillStyle = BRAND.ink;
          ctx.font = "700 28px Arial";
          ctx.fillText(`Print ${i + 1}`, x + 180, 885);
        });
        ctx.font = "400 36px Arial";
        ctx.fillText("Perfect for gallery walls, nurseries, bedrooms, and cozy spaces", 1000, 1200);
      }

      if (assetType === "watermark") {
        drawCover(ctx, img, 0, 0, 2000, 1500);
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
    for (const asset of LISTING_ASSETS) {
      await generateListingAsset(asset.type);
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  async function createInstructions() {
    setBusy(true);
    try {
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
      ctx.fillText("Included Sizes", 140, y);
      y += 70;
      ctx.font = "400 34px Arial";
      PRINT_SIZES.forEach((s) => {
        ctx.fillText(`• ${s.label} — ${s.width} × ${s.height}px`, 165, y);
        y += 50;
      });
      y += 45;
      ctx.font = "700 46px Georgia, serif";
      ctx.fillText("How to Print", 140, y);
      y += 70;
      ctx.font = "400 34px Arial";
      ["Download your files from Etsy.", "Choose the file that matches your frame.", "Print at home, online, or at a local print shop.", "Colors may vary slightly by monitor, paper, and printer."].forEach((line) => {
        ctx.fillText(`• ${line}`, 165, y);
        y += 52;
      });
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
      saveBlob(blob, `${slugify(title)}_customer_instructions.jpg`);
      setStatus("Customer instruction sheet downloaded.");
    } catch (e) {
      setStatus(e.message || "Instructions failed.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadSeoText() {
    const text = `ETSY TITLE\n${seo.seoTitle}\n\nTAGS\n${seo.tags.join(", ")}\n\nDESCRIPTION\n${seo.description}\n\nPHOTO PLAN\n${seo.photoPlan.map((item) => `- ${item}`).join("\n")}\n\nSEO FILENAMES\n${PRINT_SIZES.map((size) => seoFileName(title, niche, size.label)).join("\n")}`;
    saveBlob(new Blob([text], { type: "text/plain" }), `${slugify(title)}_etsy_seo_listing_copy.txt`);
    setStatus("SEO copy downloaded.");
  }

  async function copySeo() {
    try {
      await navigator.clipboard.writeText(`ETSY TITLE\n${seo.seoTitle}\n\nTAGS\n${seo.tags.join(", ")}\n\nDESCRIPTION\n${seo.description}`);
      setStatus("SEO copied to clipboard.");
    } catch {
      setStatus("Copy failed. You can manually copy the text from the SEO section.");
    }
  }

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
            <p className="hero-copy">Upload one artwork and create print files, listing photos, customer instructions, and Etsy SEO copy with your Rustic Palm branding.</p>
            <div className="steps">
              {["Upload", "Create", "Market", "Publish"].map((step, i) => <div key={step} className={i === 0 ? "step active" : "step"}>{i + 1}. {step}</div>)}
            </div>
          </div>
        </Card>

        <div className="tabs">
          {["create", "assets", "seo"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "tab active" : "tab"}>{titleCase(tab)}</button>)}
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

        {activeTab === "assets" && (
          <div className="asset-panel">
            <div className="action-grid">
              <Button disabled={busy || !url} onClick={createPrintBundle}>Create Print Bundle</Button>
              <Button variant="wood" disabled={busy || !url} onClick={createAllListingImages}>Create All Listing Images</Button>
              <Button variant="outline" disabled={busy} onClick={createInstructions}>Customer Instructions</Button>
              <Button variant="outline" disabled={busy} onClick={downloadSeoText}>Download SEO Copy</Button>
            </div>

            <Card className="section-card">
              <h2>Listing Photo Enhancements</h2>
              <div className="asset-buttons">
                {LISTING_ASSETS.map((asset) => <button key={asset.type} disabled={busy || !url} onClick={() => generateListingAsset(asset.type)}><strong>{asset.label}</strong><span>2000 × 1500px</span></button>)}
              </div>
            </Card>

            <Card className="section-card">
              <h2>Print Sizes + Quality</h2>
              <div className="size-grid">
                {PRINT_SIZES.map((s) => <div key={s.label} className="size-card"><strong>{s.label}</strong><span>{s.width} × {s.height}px</span><em>{qualityLabel(dimensions, s)}</em></div>)}
              </div>
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
      </div>
    </main>
  );
}
