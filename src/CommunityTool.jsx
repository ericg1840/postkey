import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Image as ImageIcon, User, Building2 } from "lucide-react";
import {
  UI, PINK, BLACK, WHITE, ASPECTS, ACCENT_PRESETS,
  DEFAULT_HEADSHOT_URL, DEFAULT_LOGO_URL,
  mixWithWhite, drawCover, wrapText, roundRect,
  useUploadedImage, useAgentAsset, UploadBox, TopNav,
} from "./shared.jsx";

// Four kinds of community goodwill posts — each just changes the headline,
// script word, corner badge, and the placeholder copy in the body field.
const TEMPLATES = {
  spotlight: {
    label: "Local Spotlight",
    word1: "Local",
    script: "Favorite!",
    badge: "Shared with\nlove by\nBilly Jo",
    subjectLabel: "BUSINESS NAME",
    subjectPlaceholder: "The Kettle & Vine",
    bodyLabel: "WHY YOU LOVE IT",
    bodyPlaceholder: "Best cortado in Warminster, and they remember your order. Tell them Billy Jo sent you!",
  },
  reno_tip: {
    label: "Reno Tip",
    word1: "Reno",
    script: "Tip!",
    badge: "Home Tip\nfrom\nBilly Jo",
    subjectLabel: "TIP TITLE",
    subjectPlaceholder: "Caulk Your Baseboards",
    bodyLabel: "THE TIP",
    bodyPlaceholder: "A $6 tube of caulk along the baseboards makes a room look freshly renovated in under an hour.",
  },
  paint: {
    label: "Paint Pick",
    word1: "Paint",
    script: "Pick!",
    badge: "Color of the\nSeason from\nBilly Jo",
    subjectLabel: "COLOR NAME",
    subjectPlaceholder: "Sherwin-Williams ‘Evergreen Fog’",
    bodyLabel: "WHY IT WORKS",
    bodyPlaceholder: "A moody sage that photographs beautifully for listing photos and pairs with almost any trim white.",
  },
  recipe: {
    label: "Recipe",
    word1: "Try This",
    script: "Recipe!",
    badge: "Kitchen\nFavorite from\nBilly Jo",
    subjectLabel: "RECIPE NAME",
    subjectPlaceholder: "Sheet-Pan Fall Veggies",
    bodyLabel: "THE RECIPE",
    bodyPlaceholder: "Toss squash, carrots, and red onion in olive oil, maple syrup, and thyme. Roast at 425° for 30 minutes.",
  },
  neighborhood: {
    label: "Neighborhood Guide",
    word1: "Neighborhood",
    script: "Guide!",
    badge: "Your Guide\nto the Area\nfrom Billy Jo",
    subjectLabel: "NEIGHBORHOOD NAME",
    subjectPlaceholder: "Chestnut Hill",
    bodyLabel: "WHAT TO KNOW",
    bodyPlaceholder: "Walkable downtown, top-rated schools, and a farmers market every Saturday from May through October.",
  },
  home_value: {
    label: "Home Value Tip",
    word1: "Value",
    script: "Tip!",
    badge: "Home Value\nTip from\nBilly Jo",
    subjectLabel: "TIP TITLE",
    subjectPlaceholder: "Skip the Full Kitchen Remodel",
    bodyLabel: "THE TIP",
    bodyPlaceholder: "A full kitchen remodel rarely returns more than 60% at resale — fresh paint and new hardware often does more per dollar.",
  },
  design_trend: {
    label: "Design Trend",
    word1: "Design",
    script: "Trend!",
    badge: "Trending Now\nfrom\nBilly Jo",
    subjectLabel: "TREND NAME",
    subjectPlaceholder: "Warm Minimalism",
    bodyLabel: "WHY IT'S TRENDING",
    bodyPlaceholder: "Soft neutrals, natural wood tones, and curved furniture — the “cozy but clean” look buyers keep asking for.",
  },
};

const DEFAULTS = {
  template: "spotlight",
  aspect: "square",
  word1: "Local",
  script: "Favorite!",
  badgeText: "Shared with\nlove by\nBilly Jo",
  subject: "The Kettle & Vine",
  body: "Best cortado in Warminster, and they remember your order. Tell them Billy Jo sent you!",
  agentName: "Billy Jo Salkowski, Realtor",
  agentPhone: "(610) 308-5894",
  agentEmail: "billyjosalkowski@gmail.com",
  brokerageName: "RE/MAX Main Line",
  brokerageCity: "Kimberton",
  officePhone: "(610) 489-5900",
  contactBg: "white",
  accentColor: "#E0298C",
};

export function CommunityTool({ onSwitchTool }) {
  const [form, setForm] = useState(DEFAULTS);
  const [fontsReady, setFontsReady] = useState(false);
  const canvasRef = useRef(null);
  const photo = useUploadedImage();
  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Billy Jo headshot");
  const logo = useAgentAsset(DEFAULT_LOGO_URL, "RE/MAX Achievers logo");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    Promise.all([
      document.fonts.load('900 60px "Playfair Display"'),
      document.fonts.load('400 40px "Permanent Marker"'),
      document.fonts.load('800 30px "Montserrat"'),
      document.fonts.load('600 16px "Public Sans"'),
    ]).catch(() => {}).finally(() => setFontsReady(true));
  }, []);

  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    setForm((f) => ({
      ...f,
      template: key,
      word1: t.word1,
      script: t.script,
      badgeText: t.badge,
    }));
  };

  const activeTemplate = TEMPLATES[form.template];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = ASPECTS[form.aspect];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    const addressH = h * 0.075;
    const contactH = h * 0.165;
    const bodyH = h * 0.16;
    const photoH = h - addressH - contactH - bodyH;

    // ---- Photo ----
    if (photo.img) {
      drawCover(ctx, photo.img, 0, 0, w, photoH);
    } else {
      ctx.fillStyle = "#D8CFC9";
      ctx.fillRect(0, 0, w, photoH);
      ctx.fillStyle = UI.inkSoft;
      ctx.font = `600 ${w * 0.03}px "Public Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Upload a photo", w / 2, photoH / 2);
      ctx.textAlign = "left";
    }

    // ---- Headline overlay (lower portion of photo) ----
    const bandH = photoH * 0.26;
    const bandY = photoH - bandH - photoH * 0.02;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.fillRect(0, bandY, w, bandH);
    ctx.restore();

    const w1x = w * 0.06;
    const headlineGap = w * 0.025;
    const headlineMaxW = w - w1x * 2;

    let word1Size = bandH * 0.5;
    let scriptSize = bandH * 0.62;
    ctx.font = `900 ${word1Size}px "Playfair Display", serif`;
    let w1Width = ctx.measureText(form.word1).width;
    ctx.font = `400 ${scriptSize}px "Permanent Marker", cursive`;
    let scriptWidth = ctx.measureText(form.script).width;
    const headlineTotalW = w1Width + headlineGap + scriptWidth;
    if (headlineTotalW > headlineMaxW) {
      const scale = headlineMaxW / headlineTotalW;
      word1Size *= scale;
      scriptSize *= scale;
      ctx.font = `900 ${word1Size}px "Playfair Display", serif`;
      w1Width = ctx.measureText(form.word1).width;
    }

    ctx.font = `900 ${word1Size}px "Playfair Display", serif`;
    ctx.fillStyle = BLACK;
    ctx.textBaseline = "alphabetic";
    const w1y = bandY + bandH * 0.62;
    ctx.fillText(form.word1, w1x, w1y);

    ctx.font = `400 ${scriptSize}px "Permanent Marker", cursive`;
    ctx.fillStyle = form.accentColor;
    ctx.fillText(form.script, w1x + w1Width + headlineGap, bandY + bandH * 0.78);

    // ---- Corner badge ----
    if (form.badgeText) {
      const badgeLines = form.badgeText.split("\n").filter(Boolean);
      const margin = w * 0.045;
      const availableW = w * 0.5;

      let badgeFont = h * 0.032;
      const measure = (font) => {
        ctx.font = `400 ${font}px "Permanent Marker", cursive`;
        const maxLineW = Math.max(...badgeLines.map((l) => ctx.measureText(l).width));
        return maxLineW + font * 0.7;
      };
      let badgeW = measure(badgeFont);
      if (badgeW > availableW) {
        badgeFont = badgeFont * (availableW / badgeW);
        badgeW = measure(badgeFont);
      }
      const badgeH = badgeLines.length * badgeFont * 1.2 + h * 0.016;
      const badgeX = w - margin - badgeW;
      const badgeY = margin;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.28)";
      ctx.shadowBlur = w * 0.012;
      ctx.shadowOffsetY = h * 0.004;
      ctx.fillStyle = form.accentColor;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH * 0.14);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = WHITE;
      ctx.textAlign = "center";
      ctx.font = `400 ${badgeFont}px "Permanent Marker", cursive`;
      badgeLines.forEach((line, i) => ctx.fillText(line, badgeX + badgeW / 2, badgeY + badgeFont * 1.15 * (i + 1)));
      ctx.textAlign = "left";
    }

    // ---- Subject band (white) — business name / tip title / color name / recipe name ----
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, photoH, w, addressH);
    ctx.fillStyle = BLACK;
    let subjSize = addressH * 0.44;
    const subjText = (form.subject || "").toUpperCase();
    const subjMaxW = w * 0.9;
    ctx.font = `800 ${subjSize}px "Montserrat", sans-serif`;
    const subjWidth = ctx.measureText(subjText).width;
    if (subjWidth > subjMaxW) {
      subjSize *= subjMaxW / subjWidth;
      ctx.font = `800 ${subjSize}px "Montserrat", sans-serif`;
    }
    ctx.fillText(subjText, w * 0.045, photoH + addressH / 2 + subjSize * 0.35);

    // ---- Body copy (the tip / recipe / description) — every wrapped line rendered, not just the first ----
    const bodyY0 = photoH + addressH;
    ctx.fillStyle = mixWithWhite(form.accentColor, 0.9);
    ctx.fillRect(0, bodyY0, w, bodyH);
    if (form.body) {
      const bodySize = bodyH * 0.135;
      ctx.font = `500 ${bodySize}px "Montserrat", sans-serif`;
      ctx.fillStyle = UI.ink;
      const bodyLines = wrapText(ctx, form.body, w * 0.9).slice(0, 4);
      const lineH = bodySize * 1.38;
      const blockH = bodyLines.length * lineH;
      const startY = bodyY0 + (bodyH - blockH) / 2 + bodySize * 0.9;
      bodyLines.forEach((line, i) => ctx.fillText(line, w * 0.06, startY + i * lineH));
    }

    // ---- Contact band ----
    const contactY0 = bodyY0 + bodyH;
    const isDark = form.contactBg === "black";
    ctx.fillStyle = isDark ? BLACK : WHITE;
    ctx.fillRect(0, contactY0, w, contactH);
    const contactTextColor = isDark ? WHITE : BLACK;

    const circleD = headshot.img ? contactH * 0.82 : 0;
    const circleCX = w - w * 0.03 - circleD / 2;
    const circleCY = contactY0 + contactH / 2;
    const headshotX = circleCX - circleD / 2;

    if (headshot.img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(circleCX, circleCY, circleD / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const img = headshot.img;
      const shortSide = Math.min(img.width, img.height);
      const cropSize = shortSide * 0.82;
      const sx = (img.width - cropSize) / 2;
      const sy = 0;
      ctx.drawImage(img, sx, sy, cropSize, cropSize, headshotX, circleCY - circleD / 2, circleD, circleD);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(circleCX, circleCY, circleD / 2, 0, Math.PI * 2);
      ctx.strokeStyle = form.accentColor;
      ctx.lineWidth = Math.max(2, w * 0.004);
      ctx.stroke();
    }

    let textStartX = w * 0.045;
    if (logo.img) {
      const logoSize = contactH * 0.6;
      const logoY = contactY0 + (contactH - logoSize) / 2;
      const ratio = logo.img.width / logo.img.height;
      const logoW = logoSize * ratio;
      ctx.drawImage(logo.img, textStartX, logoY, logoW, logoSize);
      textStartX += logoW + w * 0.03;
    }

    const textMaxW = (headshot.img ? headshotX : w) - textStartX - w * 0.03;
    const mutedColor = isDark ? "rgba(255,255,255,0.6)" : UI.inkSoft;

    const fitFont = (text, weight, baseSize) => {
      let size = baseSize;
      ctx.font = `${weight} ${size}px "Montserrat", sans-serif`;
      const measured = ctx.measureText(text).width;
      if (measured > textMaxW) {
        size = size * (textMaxW / measured);
        ctx.font = `${weight} ${size}px "Montserrat", sans-serif`;
      }
      return size;
    };

    ctx.textAlign = "left";

    const nameSize = fitFont(form.agentName, 800, contactH * 0.175);
    const nameY = contactY0 + contactH * 0.32;
    ctx.fillStyle = contactTextColor;
    ctx.fillText(form.agentName, textStartX, nameY);

    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = Math.max(2, w * 0.0035);
    ctx.beginPath();
    ctx.moveTo(textStartX, nameY + contactH * 0.075);
    ctx.lineTo(textStartX + w * 0.055, nameY + contactH * 0.075);
    ctx.stroke();

    const contactY = contactY0 + contactH * 0.55;
    const contactSize = contactH * 0.11;
    const sep = "   •   ";
    if (form.agentPhone && form.agentEmail) {
      ctx.font = `600 ${contactSize}px "Montserrat", sans-serif`;
      let full = form.agentPhone + sep + form.agentEmail;
      let size = contactSize;
      let measured = ctx.measureText(full).width;
      if (measured > textMaxW) {
        size = size * (textMaxW / measured);
        ctx.font = `600 ${size}px "Montserrat", sans-serif`;
      }
      ctx.fillStyle = contactTextColor;
      ctx.fillText(form.agentPhone, textStartX, contactY);
      const phoneW = ctx.measureText(form.agentPhone).width;
      ctx.fillStyle = mutedColor;
      ctx.fillText(sep, textStartX + phoneW, contactY);
      const sepW = ctx.measureText(sep).width;
      ctx.fillStyle = form.accentColor;
      ctx.fillText(form.agentEmail, textStartX + phoneW + sepW, contactY);
    } else if (form.agentPhone || form.agentEmail) {
      ctx.fillStyle = form.agentPhone ? contactTextColor : form.accentColor;
      fitFont(form.agentPhone || form.agentEmail, 600, contactSize);
      ctx.fillText(form.agentPhone || form.agentEmail, textStartX, contactY);
    }

    const brokerLine = [form.brokerageName, form.brokerageCity].filter(Boolean).join("   ·   ");
    if (brokerLine) {
      fitFont(brokerLine, 700, contactH * 0.115);
      ctx.fillStyle = contactTextColor;
      ctx.fillText(brokerLine, textStartX, contactY0 + contactH * 0.76);
    }

    if (form.officePhone) {
      const officeText = `Office  ${form.officePhone}`;
      fitFont(officeText, 500, contactH * 0.09);
      ctx.fillStyle = mutedColor;
      ctx.fillText(officeText, textStartX, contactY0 + contactH * 0.9);
    }
  }, [form, photo.img, headshot.img, logo.img]);

  useEffect(() => { if (fontsReady) draw(); }, [draw, fontsReady]);

  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    setDownloadError("");

    const safeName = (form.subject || "community-post").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const filename = `${safeName}-${form.template}.png`;

    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });

      if (navigator.canShare) {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          setDownloading(false);
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      if (e && e.name === "AbortError") {
        // user cancelled the share sheet — not an error
      } else {
        try {
          window.open(canvas.toDataURL("image/png"), "_blank");
          setDownloadError("Opened the image in a new tab — press and hold it, then choose Save Image.");
        } catch (e2) {
          setDownloadError(
            "The download was blocked because the headshot or logo comes from a site that doesn't allow this. Save that image to your device and re-upload it in the Headshot/Logo box above, then try again."
          );
        }
      }
    }
    setDownloading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: UI.stone, color: UI.ink }}>
      <TopNav active="community" onSwitch={onSwitchTool} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        {/* HERO PREVIEW */}
        <div className="mb-8 sm:mb-12">
          <div
            className="rounded-lg border flex items-center justify-center p-2 sm:p-6"
            style={{ background: UI.card, borderColor: UI.line }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: "100%",
                maxWidth: "720px",
                height: "auto",
                borderRadius: "4px",
                boxShadow: "0 28px 64px rgba(39,27,32,0.3)",
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <button
              onClick={downloadImage}
              disabled={downloading}
              className="w-full sm:w-auto flex-1 py-5 px-8 rounded-lg font-body font-bold text-lg flex items-center justify-center gap-3 transition hover:opacity-90 disabled:opacity-60"
              style={{ background: BLACK, color: WHITE }}
            >
              <Download size={22} /> {downloading ? "Preparing..." : "Download image"}
            </button>
            <p className="font-body text-xs text-center sm:text-left" style={{ color: UI.inkSoft, maxWidth: "22rem" }}>
              Photos stay on this device — nothing is uploaded anywhere. Add your logo once and it'll be there for every post.
            </p>
          </div>
          {downloadError && (
            <p className="font-body text-xs mt-2" style={{ color: PINK }}>{downloadError}</p>
          )}
        </div>

        {/* CONTROLS */}
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
          <div className="md:col-span-2">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>POST TYPE</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button key={key} onClick={() => applyTemplate(key)}
                  className="text-left p-3 rounded border transition font-body text-xs"
                  style={{ borderColor: form.template === key ? PINK : UI.line, background: form.template === key ? UI.card : "transparent" }}>
                  <span className="font-semibold block">{t.label}</span>
                  <span style={{ color: UI.inkSoft }}>{t.word1} {t.script}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>ACCENT COLOR</span>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENT_PRESETS.map((c) => (
                <button key={c} onClick={() => setForm((f) => ({ ...f, accentColor: c }))}
                  aria-label={c}
                  className="rounded-full transition"
                  style={{
                    width: "1.75rem", height: "1.75rem", background: c,
                    border: form.accentColor.toLowerCase() === c.toLowerCase() ? `2px solid ${UI.ink}` : "2px solid transparent",
                    boxShadow: form.accentColor.toLowerCase() === c.toLowerCase() ? `0 0 0 2px ${UI.card}` : "none",
                  }} />
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="color" value={form.accentColor}
                  onChange={(e) => setForm((f) => ({ ...f, accentColor: e.target.value }))}
                  style={{ width: "1.75rem", height: "1.75rem", padding: 0, border: `1px solid ${UI.line}`, borderRadius: "0.35rem", background: "none" }} />
                <span className="font-mono text-xs" style={{ color: UI.inkSoft }}>Custom</span>
              </label>
            </div>
          </div>

          <UploadBox label="PHOTO" icon={ImageIcon} state={photo} hint="Drop or click to add a photo" />

          <div className="grid grid-cols-2 gap-3">
            <UploadBox label="HEADSHOT" icon={User} state={headshot} hint="Your photo" />
            <UploadBox label="LOGO" icon={Building2} state={logo} hint="Brokerage logo" />
          </div>

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>{activeTemplate.subjectLabel}</span>
            <input className="input" value={form.subject} onChange={update("subject")} placeholder={activeTemplate.subjectPlaceholder} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE WORD 1</span>
              <input className="input" value={form.word1} onChange={update("word1")} />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SCRIPT WORD</span>
              <input className="input" value={form.script} onChange={update("script")} />
            </label>
          </div>

          <label className="block md:col-span-2">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>{activeTemplate.bodyLabel}</span>
            <textarea className="input" rows={3} value={form.body} onChange={update("body")} placeholder={activeTemplate.bodyPlaceholder} />
          </label>

          <label className="block md:col-span-2">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CORNER BADGE TEXT</span>
            <textarea className="input" rows={3} value={form.badgeText} onChange={update("badgeText")} />
          </label>

          <div className="md:col-span-2">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SIZE</span>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(ASPECTS).map(([key, a]) => (
                <button key={key} onClick={() => setForm((f) => ({ ...f, aspect: key }))}
                  className="p-2 rounded border font-body text-xs font-semibold transition"
                  style={{ borderColor: form.aspect === key ? PINK : UI.line, background: form.aspect === key ? UI.card : "transparent" }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CONTACT BAND</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setForm((f) => ({ ...f, contactBg: "black" }))}
                className="p-2 rounded border font-body text-xs font-semibold transition"
                style={{ borderColor: form.contactBg === "black" ? PINK : UI.line, background: form.contactBg === "black" ? UI.card : "transparent" }}>
                Black background
              </button>
              <button onClick={() => setForm((f) => ({ ...f, contactBg: "white" }))}
                className="p-2 rounded border font-body text-xs font-semibold transition"
                style={{ borderColor: form.contactBg === "white" ? PINK : UI.line, background: form.contactBg === "white" ? UI.card : "transparent" }}>
                White background
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>AGENT NAME</span>
              <input className="input" value={form.agentName} onChange={update("agentName")} />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CELL PHONE</span>
              <input className="input" value={form.agentPhone} onChange={update("agentPhone")} />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>EMAIL</span>
              <input className="input" value={form.agentEmail} onChange={update("agentEmail")} />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BROKERAGE</span>
              <input className="input" value={form.brokerageName} onChange={update("brokerageName")} />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OFFICE CITY</span>
              <input className="input" value={form.brokerageCity} onChange={update("brokerageCity")} />
            </label>
            <label className="block col-span-2">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OFFICE PHONE</span>
              <input className="input" value={form.officePhone} onChange={update("officePhone")} />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}
