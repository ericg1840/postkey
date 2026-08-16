import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Image as ImageIcon, User, Building2, SlidersHorizontal } from "lucide-react";
import {
  UI, ACCENT, ERROR, BLACK, WHITE, ASPECTS, ACCENT_PRESETS, SCRIPT_FONTS, scriptFontCss,
  DEFAULT_HEADSHOT_URL, DEFAULT_LOGO_URL,
  mixWithWhite, drawCover, wrapText, roundRect, archedRect, drawContactBand,
  useUploadedImage, useAgentAsset, UploadBox, PhotoReposition, TopNav, isMobileDevice,
  Accordion, PrivacyBadge, splitHeadlineLastWord, splitHeadlineFirstWord, firstNameOf,
} from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

// "What are you posting?" — the event, independent of which visual Style
// draws it. Applying one fills in every layout's headline representation
// at once, so switching Style afterward never loses the chosen wording.
const TEMPLATES = {
  sold: { label: "Just Sold", word1: "Just", script: "SOLD!", badge: "Another Home\nSold by\n{agent}" },
  just_listed: { label: "Just Listed", word1: "Just", script: "Listed!", badge: "New on the\nMarket with\n{agent}" },
  open_house: { label: "Open House", word1: "Open", script: "House!", badge: "See You\nThere with\n{agent}" },
  price_improvement: { label: "New Price", word1: "New", script: "Price!", badge: "Priced to\nMove with\n{agent}" },
  under_contract: { label: "Under Contract", word1: "Under", script: "Contract!", badge: "Another One\nUnder Contract" },
  coming_soon: { label: "Coming Soon", word1: "Coming", script: "Soon!", badge: "Coming Soon\nwith\n{agent}" },
};

const DEFAULTS = {
  layout: "bold",
  template: "sold",
  aspect: "square",
  word1: "Just",
  script: "SOLD!",
  bigHeadline: "JUST LISTED",
  banner: "",
  highlight: "",
  address: "419 Tall Oaks Dr, Warminster",
  beds: "4",
  baths: "4",
  sqft: "3,028",
  price: "$2,295,000",
  badgeText: "Another Home\nSold by\n{agent}",
  modernScript: "just",
  modernHeadline: "Listed",
  bottomMessage: "Message for more details",
  agentName: "Your Name, Realtor",
  agentPhone: "(555) 123-4567",
  agentEmail: "you@example.com",
  brokerageName: "Your Brokerage",
  brokerageCity: "Your City",
  officePhone: "(555) 987-6543",
  contactBg: "white",
  accentColor: "#E0298C",
  scriptFont: "Dancing Script",
};

export function ListingTool({ onSwitchTool, onGoHome }) {
  const { user, brandKit, logout, saveBrandKit } = useAuth();
  const [form, setForm] = useState(() => {
    const agentName = brandKit?.agentName ?? DEFAULTS.agentName;
    return {
      ...DEFAULTS,
      agentName,
      agentPhone: brandKit?.agentPhone ?? "",
      agentEmail: brandKit?.agentEmail ?? "",
      brokerageName: brandKit?.brokerageName ?? "",
      brokerageCity: brandKit?.brokerageCity ?? "",
      officePhone: brandKit?.officePhone ?? "",
      website: brandKit?.website ?? "",
      licenseNumber: brandKit?.licenseNumber ?? "",
      accentColor: brandKit?.accentColor || DEFAULTS.accentColor,
      scriptFont: brandKit?.scriptFont || DEFAULTS.scriptFont,
      badgeText: DEFAULTS.badgeText.replace("{agent}", firstNameOf(agentName)),
    };
  });
  const [fontsReady, setFontsReady] = useState(false);
  const [brandStatus, setBrandStatus] = useState("idle"); // idle | saving | saved | error
  const canvasRef = useRef(null);
  const photo = useUploadedImage();
  const photo2 = useUploadedImage();
  const photo3 = useUploadedImage();
  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Headshot", brandKit?.headshotUrl);
  const logo = useAgentAsset(DEFAULT_LOGO_URL, "Brokerage logo", brandKit?.logoUrl);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSaveBrand = async () => {
    setBrandStatus("saving");
    try {
      await saveBrandKit({
        agentName: form.agentName,
        agentPhone: form.agentPhone,
        agentEmail: form.agentEmail,
        brokerageName: form.brokerageName,
        brokerageCity: form.brokerageCity,
        officePhone: form.officePhone,
        website: form.website,
        licenseNumber: form.licenseNumber,
        accentColor: form.accentColor,
        scriptFont: form.scriptFont,
        headshotUrl: headshot.source === "custom" ? headshot.url : null,
        logoUrl: logo.source === "custom" ? logo.url : null,
        onboarded: true,
      });
      setBrandStatus("saved");
    } catch {
      setBrandStatus("error");
    }
  };

  useEffect(() => {
    Promise.all([
      document.fonts.load('900 60px "Playfair Display"'),
      document.fonts.load('800 30px "Montserrat"'),
      document.fonts.load('600 16px "Public Sans"'),
      ...SCRIPT_FONTS.map((f) => document.fonts.load(`${f.weight} 40px "${f.name}"`)),
    ]).catch(() => {}).finally(() => setFontsReady(true));
  }, []);

  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    setForm((f) => ({
      ...f,
      template: key,
      word1: t.word1,
      script: t.script,
      badgeText: t.badge.replace("{agent}", firstNameOf(f.agentName)),
      bigHeadline: `${t.word1} ${t.script}`.toUpperCase(),
      modernScript: t.word1.toLowerCase(),
      modernHeadline: t.script.replace(/!+$/, ""),
    }));
  };

  const drawBoldLayout = (ctx, w, h) => {
    const addressH = h * 0.075;
    const contactH = Math.min(w, h) * 0.165;
    const photoH = h - addressH - contactH;

    // ---- Photo ----
    if (photo.img) {
      drawCover(ctx, photo.img, 0, 0, w, photoH, photo.focus.x, photo.focus.y, photo.zoom);
    } else {
      ctx.fillStyle = "#D8CFC9";
      ctx.fillRect(0, 0, w, photoH);
      ctx.fillStyle = UI.inkSoft;
      ctx.font = `600 ${w * 0.03}px "Public Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("Upload the property photo", w / 2, photoH / 2);
      ctx.textAlign = "left";
    }

    // ---- Achievement banner (optional, top of photo) ----
    if (form.banner) {
      ctx.font = `800 ${photoH * 0.052}px "Montserrat", sans-serif`;
      const textW = ctx.measureText(form.banner).width;
      const padX = w * 0.03;
      const padY = photoH * 0.018;
      const bw = textW + padX * 2;
      const bh = photoH * 0.052 + padY * 2;
      const bx = w * 0.045;
      const by = photoH * 0.045;
      ctx.fillStyle = mixWithWhite(form.accentColor, 0.78);
      roundRect(ctx, bx, by, bw, bh, bh * 0.4);
      ctx.fill();
      ctx.fillStyle = "#2A1030";
      ctx.textBaseline = "middle";
      ctx.fillText(form.banner, bx + padX, by + bh / 2 + photoH * 0.003);
      ctx.textBaseline = "alphabetic";
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
    ctx.font = scriptFontCss(form.scriptFont, scriptSize);
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

    ctx.font = scriptFontCss(form.scriptFont, scriptSize);
    ctx.fillStyle = form.accentColor;
    ctx.fillText(form.script, w1x + w1Width + headlineGap, bandY + bandH * 0.78);

    // ---- Highlight line (optional, directly above the headline band, still on photo) ----
    if (form.highlight) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = w * 0.006;
      ctx.font = `italic 700 ${photoH * 0.036}px "Montserrat", sans-serif`;
      ctx.fillStyle = WHITE;
      const lines = wrapText(ctx, form.highlight, w * 0.9);
      ctx.fillText(lines[0] || "", w * 0.06, bandY - photoH * 0.025);
      ctx.restore();
    }

    // ---- Address band (white) ----
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, photoH, w, addressH);
    ctx.fillStyle = BLACK;
    let addrSize = addressH * 0.44;
    const addrText = (form.address || "").toUpperCase();
    const addrMaxW = w * 0.9;
    ctx.font = `800 ${addrSize}px "Montserrat", sans-serif`;
    const addrWidth = ctx.measureText(addrText).width;
    if (addrWidth > addrMaxW) {
      addrSize *= addrMaxW / addrWidth;
      ctx.font = `800 ${addrSize}px "Montserrat", sans-serif`;
    }
    ctx.fillText(addrText, w * 0.045, photoH + addressH / 2 + addrSize * 0.35);

    // ---- Contact band (brokerage-required, shared across every layout) ----
    const contactY0 = photoH + addressH;
    drawContactBand(ctx, w, contactY0, contactH, form, headshot, logo);

    // ---- Pink badge: top-right corner of the property photo ----
    if (form.badgeText) {
      const badgeLines = form.badgeText.split("\n").filter(Boolean);
      const margin = w * 0.045;
      const availableW = w * 0.5;

      let badgeFont = h * 0.032;
      const measure = (font) => {
        ctx.font = scriptFontCss(form.scriptFont, font);
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
      ctx.font = scriptFontCss(form.scriptFont, badgeFont);
      badgeLines.forEach((line, i) => ctx.fillText(line, badgeX + badgeW / 2, badgeY + badgeFont * 1.15 * (i + 1)));
      ctx.textAlign = "left";
    }
  };

  // ---- Editorial layout: single dominant photo, centered headline, stats row, arched photo strip ----
  const drawEditorialLayout = (ctx, w, h) => {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, w, h);

    const topBarH = h * 0.07;
    ctx.textAlign = "left";
    ctx.font = `700 ${topBarH * 0.34}px "Montserrat", sans-serif`;
    const brokerageUpper = form.brokerageName.toUpperCase();
    const mainLineIdx = brokerageUpper.indexOf("MAIN LINE");
    const brokerageY = topBarH * 0.62;
    if (mainLineIdx !== -1) {
      const before = brokerageUpper.slice(0, mainLineIdx);
      const highlight = brokerageUpper.slice(mainLineIdx, mainLineIdx + "MAIN LINE".length);
      const after = brokerageUpper.slice(mainLineIdx + "MAIN LINE".length);
      const totalW = ctx.measureText(before + highlight + after).width;
      let cx = w / 2 - totalW / 2;
      ctx.fillStyle = UI.ink;
      ctx.fillText(before, cx, brokerageY);
      cx += ctx.measureText(before).width;
      ctx.fillStyle = "#0043FF";
      ctx.fillText(highlight, cx, brokerageY);
      cx += ctx.measureText(highlight).width;
      ctx.fillStyle = UI.ink;
      ctx.fillText(after, cx, brokerageY);
    } else {
      ctx.fillStyle = UI.ink;
      ctx.textAlign = "center";
      ctx.fillText(brokerageUpper, w / 2, brokerageY);
    }
    ctx.textAlign = "center";

    const heroH = h * 0.42;
    const heroY = topBarH;
    if (photo.img) drawCover(ctx, photo.img, 0, heroY, w, heroH, photo.focus.x, photo.focus.y, photo.zoom);
    else {
      ctx.fillStyle = "#D8CFC9";
      ctx.fillRect(0, heroY, w, heroH);
    }

    const headlineY0 = heroY + heroH;
    const headlineH = h * 0.1;
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, headlineY0, w, headlineH);
    ctx.fillStyle = form.accentColor;
    ctx.font = `700 ${headlineH * 0.44}px "Playfair Display", serif`;
    ctx.textAlign = "center";
    ctx.fillText(form.bigHeadline.toUpperCase(), w / 2, headlineY0 + headlineH * 0.55);

    ctx.font = `500 ${headlineH * 0.2}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.inkSoft;
    ctx.fillText(form.address, w / 2, headlineY0 + headlineH * 0.85);

    const statsY0 = headlineY0 + headlineH;
    const statsH = h * 0.06;
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, statsY0, w, statsH);
    ctx.font = `700 ${statsH * 0.36}px "Montserrat", sans-serif`;
    const statsParts = [`${form.beds} bd`, `${form.baths} ba`, `${form.sqft} sf`].filter(Boolean).join("     ");
    const priceText = form.price || "";
    const gapText = statsParts && priceText ? "     " : "";
    ctx.textAlign = "left";
    const totalW = ctx.measureText(statsParts + gapText + priceText).width;
    let cursorX = w / 2 - totalW / 2;
    ctx.fillStyle = UI.ink;
    ctx.fillText(statsParts, cursorX, statsY0 + statsH * 0.62);
    cursorX += ctx.measureText(statsParts + gapText).width;
    ctx.fillStyle = form.accentColor;
    ctx.fillText(priceText, cursorX, statsY0 + statsH * 0.62);

    const contactH = Math.min(w, h) * 0.145;
    const stripY0 = statsY0 + statsH + h * 0.02;
    const stripH = h - stripY0 - h * 0.015 - contactH;
    const gap = w * 0.02;
    const tileW = (w - gap * 4) / 3;
    const tiles = [photo, photo2, photo3];
    tiles.forEach((p, i) => {
      const tx = gap + i * (tileW + gap);
      if (p.img) {
        ctx.save();
        archedRect(ctx, tx, stripY0, tileW, stripH);
        ctx.clip();
        drawCover(ctx, p.img, tx, stripY0, tileW, stripH);
        ctx.restore();
      } else {
        ctx.save();
        archedRect(ctx, tx, stripY0, tileW, stripH);
        ctx.fillStyle = "#E5DCD6";
        ctx.fill();
        ctx.restore();
      }
    });

    const footerY0 = stripY0 + stripH + h * 0.015;
    ctx.textAlign = "left";
    drawContactBand(ctx, w, footerY0, contactH, form, headshot, logo);
  };

  // ---- Collage layout: bold top headline, offset photo collage, script signature ----
  const drawCollageLayout = (ctx, w, h) => {
    ctx.fillStyle = "#F7F4EF";
    ctx.fillRect(0, 0, w, h);

    const topH = h * 0.16;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.font = `900 ${topH * 0.5}px "Playfair Display", serif`;
    const spacedHeadline = form.bigHeadline.toUpperCase().split("").join("\u2009");
    ctx.fillText(spacedHeadline, w / 2, topH * 0.72);

    const contactH = Math.min(w, h) * 0.145;
    const collageY0 = topH;
    const collageH = h * 0.5;
    const pad = w * 0.06;
    const mainW = w * 0.56 - pad;
    const sideW = w - pad * 2 - mainW - w * 0.02;
    const sideX = pad + mainW + w * 0.02;
    const sideTileH = (collageH - w * 0.02) / 2;

    if (photo.img) drawCover(ctx, photo.img, pad, collageY0, mainW, collageH, photo.focus.x, photo.focus.y, photo.zoom);
    else { ctx.fillStyle = "#D8CFC9"; ctx.fillRect(pad, collageY0, mainW, collageH); }

    if (form.address) {
      const bubbleFont = w * 0.024;
      ctx.font = `700 ${bubbleFont}px "Montserrat", sans-serif`;
      const textW = ctx.measureText(form.address.toUpperCase()).width;
      const padX = w * 0.02;
      const padY = h * 0.012;
      const bw = textW + padX * 2;
      const bh = bubbleFont + padY * 2;
      const bx = pad + w * 0.025;
      const by = collageY0 + h * 0.025;
      ctx.fillStyle = form.accentColor;
      roundRect(ctx, bx, by, bw, bh, bh * 0.5);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(form.address.toUpperCase(), bx + padX, by + bh / 2 + bubbleFont * 0.02);
      ctx.textBaseline = "alphabetic";
    }

    if (photo2.img) drawCover(ctx, photo2.img, sideX, collageY0, sideW, sideTileH);
    else { ctx.fillStyle = "#DED4CC"; ctx.fillRect(sideX, collageY0, sideW, sideTileH); }

    const tile2Y = collageY0 + sideTileH + w * 0.02;
    if (photo3.img) drawCover(ctx, photo3.img, sideX, tile2Y, sideW, sideTileH);
    else { ctx.fillStyle = "#DED4CC"; ctx.fillRect(sideX, tile2Y, sideW, sideTileH); }

    const sigY0 = collageY0 + collageH;
    const sigH = h - sigY0 - contactH;

    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.06, sigY0 + sigH * 0.18);
    ctx.lineTo(w / 2 + w * 0.06, sigY0 + sigH * 0.18);
    ctx.stroke();

    ctx.fillStyle = form.accentColor;
    ctx.font = `italic 700 ${sigH * 0.5}px "Playfair Display", serif`;
    ctx.textAlign = "center";
    ctx.fillText(form.agentName.replace(/, Realtor$/i, ""), w / 2, sigY0 + sigH * 0.62);
    ctx.font = `600 ${sigH * 0.16}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.ink;
    ctx.fillText("REAL ESTATE AGENT", w / 2, sigY0 + sigH * 0.86);
    ctx.textAlign = "left";

    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo);
  };

  // ---- Modern layout: script + serif headline, stat line, 4-up photo strip (incl. headshot), black message bar ----
  const drawModernLayout = (ctx, w, h) => {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, w, h);

    // Fixed-height bands from the bottom up; the hero photo takes whatever's left.
    const headlineH = h * 0.145;
    const stripGap = h * 0.045;
    const stripH = h * 0.22;
    const contactH = Math.min(w, h) * 0.145;
    const barH = h * 0.09;
    const heroH = h - headlineH - stripGap - stripH - contactH - barH;

    if (photo.img) drawCover(ctx, photo.img, 0, 0, w, heroH, photo.focus.x, photo.focus.y, photo.zoom);
    else { ctx.fillStyle = "#D8CFC9"; ctx.fillRect(0, 0, w, heroH); }

    // ---- Headline: cursive "just" + letter-spaced serif "LISTED" ----
    const headlineY0 = heroH;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    let scriptSize = headlineH * 0.62;
    let capsSize = headlineH * 0.4;
    const gap = w * 0.02;
    const spacedCaps = () => form.modernHeadline.toUpperCase().split("").join(" ");

    ctx.font = scriptFontCss(form.scriptFont, scriptSize);
    let scriptW = ctx.measureText(form.modernScript).width;
    ctx.font = `700 ${capsSize}px "Playfair Display", serif`;
    let capsW = ctx.measureText(spacedCaps()).width;
    const headlineMaxW = w * 0.86;
    const headlineTotalW = scriptW + gap + capsW;
    if (headlineTotalW > headlineMaxW) {
      const scale = headlineMaxW / headlineTotalW;
      scriptSize *= scale;
      capsSize *= scale;
      ctx.font = scriptFontCss(form.scriptFont, scriptSize);
      scriptW = ctx.measureText(form.modernScript).width;
      ctx.font = `700 ${capsSize}px "Playfair Display", serif`;
      capsW = ctx.measureText(spacedCaps()).width;
    }

    let hx = w / 2 - (scriptW + gap + capsW) / 2;
    const hy = headlineY0 + headlineH * 0.64;
    ctx.font = scriptFontCss(form.scriptFont, scriptSize);
    ctx.fillStyle = form.accentColor;
    ctx.fillText(form.modernScript, hx, hy);
    hx += scriptW + gap;
    ctx.font = `700 ${capsSize}px "Playfair Display", serif`;
    ctx.fillStyle = UI.ink;
    ctx.fillText(spacedCaps(), hx, hy);

    // ---- Stat line ----
    const statsY = headlineY0 + headlineH * 0.92;
    const statsSize = h * 0.021;
    const statsText = [`${form.beds} BED`, `${form.baths} BATH`, `${form.sqft} SQFT`].filter(Boolean).join("   |   ");
    ctx.font = `600 ${statsSize}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.inkSoft;
    ctx.textAlign = "center";
    ctx.fillText(statsText, w / 2, statsY);
    ctx.textAlign = "left";

    // ---- Thin accent divider ----
    const dividerY = statsY + h * 0.025;
    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = Math.max(1.5, w * 0.0025);
    ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.05, dividerY);
    ctx.lineTo(w / 2 + w * 0.05, dividerY);
    ctx.stroke();

    // ---- 4-up photo strip: 3 property photos + headshot, flush, no gaps ----
    const stripY0 = headlineY0 + headlineH + stripGap;
    const tileW = w / 4;
    const tiles = [photo, photo2, photo3];
    tiles.forEach((p, i) => {
      const tx = i * tileW;
      if (p.img) drawCover(ctx, p.img, tx, stripY0, tileW, stripH);
      else { ctx.fillStyle = "#E5DCD6"; ctx.fillRect(tx, stripY0, tileW, stripH); }
    });
    const headshotX = tileW * 3;
    if (headshot.img) drawCover(ctx, headshot.img, headshotX, stripY0, tileW, stripH);
    else { ctx.fillStyle = "#E5DCD6"; ctx.fillRect(headshotX, stripY0, tileW, stripH); }

    // ---- Contact band (brokerage-required, shared across every layout) ----
    // The agent's photo is already the 4th strip tile above, so skip the
    // headshot circle here to avoid showing it twice.
    const contactY0 = stripY0 + stripH;
    drawContactBand(ctx, w, contactY0, contactH, form, headshot, logo, false);

    // ---- Bottom message bar (single line, letter-spaced, shrinks to fit) ----
    const barY0 = h - barH;
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, barY0, w, barH);
    let msgSize = barH * 0.32;
    const spacedMsg = form.bottomMessage.toUpperCase().split("").join("\u2009");
    ctx.font = `600 ${msgSize}px "Montserrat", sans-serif`;
    let msgW = ctx.measureText(spacedMsg).width;
    const msgMaxW = w * 0.88;
    if (msgW > msgMaxW) {
      msgSize *= msgMaxW / msgW;
      ctx.font = `600 ${msgSize}px "Montserrat", sans-serif`;
    }
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.fillText(spacedMsg, w / 2, barY0 + barH / 2 + msgSize * 0.34);
    ctx.textAlign = "left";
  };

  const drawToCanvas = (canvas, aspectKey) => {
    const { w, h } = ASPECTS[aspectKey];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (form.layout === "editorial") drawEditorialLayout(ctx, w, h);
    else if (form.layout === "collage") drawCollageLayout(ctx, w, h);
    else if (form.layout === "modern") drawModernLayout(ctx, w, h);
    else drawBoldLayout(ctx, w, h);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawToCanvas(canvas, form.aspect);
  }, [form, photo.img, photo.focus, photo.zoom, photo2.img, photo3.img, headshot.img, logo.img]);

  useEffect(() => { if (fontsReady) draw(); }, [draw, fontsReady]);

  // Small live previews of the other sizes in the social set, so the promise
  // of "we'll generate every size" is visible before anyone downloads.
  const THUMB_ASPECTS = ["square", "story", "landscape"];
  const thumbRefs = useRef({});
  useEffect(() => {
    if (!fontsReady) return;
    THUMB_ASPECTS.forEach((key) => {
      const canvas = thumbRefs.current[key];
      if (canvas) drawToCanvas(canvas, key);
    });
  }, [form, photo.img, photo.focus, photo.zoom, photo2.img, photo3.img, headshot.img, logo.img, fontsReady]);

  const [showCustomize, setShowCustomize] = useState(false);
  const [wantSocialSet, setWantSocialSet] = useState(true);

  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    setDownloadError("");
    const safeName = (form.address || "social-post").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const filename = `${safeName}-${form.template}.png`;

    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });

      // On phones, the native share sheet is far more reliable than a download link —
      // iOS Safari in particular often just opens the image instead of saving it.
      if (isMobileDevice() && navigator.canShare) {
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

  const [downloadingAll, setDownloadingAll] = useState(false);

  // Generates every size back-to-back onto an offscreen canvas instead of
  // making the user pick one size up front — a small stagger between each
  // download keeps browsers from treating the burst as a popup attack.
  const downloadAllSizes = async () => {
    setDownloadingAll(true);
    setDownloadError("");
    const safeName = (form.address || "social-post").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const offscreen = document.createElement("canvas");

    for (const aspectKey of Object.keys(ASPECTS)) {
      drawToCanvas(offscreen, aspectKey);
      const blob = await new Promise((resolve, reject) => {
        offscreen.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeName}-${form.template}-${aspectKey}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      await new Promise((r) => setTimeout(r, 400));
    }
    setDownloadingAll(false);
  };

  const currentStep = !photo.img ? 1 : downloadError || downloading || downloadingAll ? 3 : 2;

  // On phones, only one step's content is visible at a time (see the
  // `mobileStep === N ? … : "hidden"` panels below) so getting from "Add
  // Photo" to "Download" doesn't mean scrolling through every section.
  // At the `lg` breakpoint the classes always resolve to visible, so
  // desktop keeps the original everything-at-once layout untouched.
  const [mobileStep, setMobileStep] = useState(1);

  return (
    <div className="min-h-screen" style={{ background: UI.stone, color: UI.ink }}>
      <TopNav active="listings" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-10">
        {/* PAGE HEADER */}
        <div className={mobileStep === 1 ? "mb-3 sm:mb-6" : "hidden lg:block lg:mb-6"}>
          <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Create a Post</h1>
          <p className="font-body text-sm mt-1 hidden sm:block" style={{ color: UI.inkSoft }}>One photo. Your brand. Done.</p>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-1 sm:gap-3 mb-5 sm:mb-8 lg:mb-8" style={{ marginBottom: mobileStep === 1 ? undefined : "0.875rem" }}>
          {[{ n: 1, label: "Add Photo" }, { n: 2, label: "Customize" }, { n: 3, label: "Download" }].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-1 sm:gap-3 min-w-0">
              <button type="button" onClick={() => setMobileStep(s.n)} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span
                  className="flex items-center justify-center rounded-full font-body text-xs font-semibold flex-shrink-0"
                  style={{
                    width: 24, height: 24,
                    background: currentStep >= s.n ? ACCENT : "transparent",
                    color: currentStep >= s.n ? WHITE : UI.inkSoft,
                    border: currentStep >= s.n ? "none" : `1.5px solid ${UI.line}`,
                  }}
                >
                  {s.n}
                </span>
                <span
                  className={`font-body text-xs sm:text-sm font-semibold truncate ${mobileStep === s.n ? "" : "hidden sm:inline"}`}
                  style={{ color: currentStep >= s.n ? UI.ink : UI.inkSoft }}
                >
                  {s.label}
                </span>
              </button>
              {i < arr.length - 1 && <div className="flex-shrink-0" style={{ width: 16, height: 1.5, background: UI.line }} />}
            </div>
          ))}
        </div>

        {/* MAIN GRID: controls + preview */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: CONTROLS */}
          <div className={mobileStep === 3 ? "hidden lg:grid lg:gap-6" : "grid gap-6"}>
          <div className={`${mobileStep === 1 ? "grid gap-6" : "hidden"} lg:contents`}>
            <section>
              <h3 className="font-body text-sm font-semibold mb-2.5" style={{ color: UI.ink }}>1. What are you posting?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button key={key} onClick={() => applyTemplate(key)}
                    className="text-left p-3 rounded-lg border transition font-body text-xs font-semibold"
                    style={{ borderColor: form.template === key ? ACCENT : UI.line, background: form.template === key ? UI.card : "transparent" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-body text-sm font-semibold mb-1" style={{ color: UI.ink }}>2. Add your photo</h3>
              <p className="font-body text-xs mb-2.5" style={{ color: UI.inkSoft }}>Upload a listing photo and we'll create your branded post.</p>
              <UploadBox label="PROPERTY PHOTO" icon={ImageIcon} state={photo} hint="Choose listing photo, or drag and drop here" />
              <PhotoReposition state={photo} aspect={form.aspect} />

              {form.layout !== "modern" && (
                <label className="block mt-3">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>ADDRESS</span>
                  <input className="input" value={form.address} onChange={update("address")} />
                </label>
              )}

              {form.layout !== "bold" && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <UploadBox label={form.layout === "collage" ? "PHOTO 2 (top right)" : "PHOTO 2 (strip)"} icon={ImageIcon} state={photo2} hint="Second photo" />
                  <UploadBox label={form.layout === "collage" ? "PHOTO 3 (bottom right)" : "PHOTO 3 (strip)"} icon={ImageIcon} state={photo3} hint="Third photo" />
                </div>
              )}

              {form.layout === "editorial" && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BEDS</span>
                    <input className="input" value={form.beds} onChange={update("beds")} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BATHS</span>
                    <input className="input" value={form.baths} onChange={update("baths")} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SQFT</span>
                    <input className="input" value={form.sqft} onChange={update("sqft")} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PRICE</span>
                    <input className="input" value={form.price} onChange={update("price")} />
                  </label>
                </div>
              )}

              {form.layout === "modern" && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BEDS</span>
                    <input className="input" value={form.beds} onChange={update("beds")} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BATHS</span>
                    <input className="input" value={form.baths} onChange={update("baths")} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SQFT</span>
                    <input className="input" value={form.sqft} onChange={update("sqft")} />
                  </label>
                </div>
              )}

              <p className="font-body text-xs mt-2.5" style={{ color: UI.inkSoft }}>Tip: use a bright, high-quality photo for best results.</p>
            </section>

            <button
              type="button"
              onClick={() => setMobileStep(2)}
              className="lg:hidden w-full py-2.5 rounded-lg font-body font-semibold text-sm transition"
              style={{ background: ACCENT, color: WHITE }}
            >
              Continue to Customize
            </button>
          </div>

            <div className={`${mobileStep === 2 ? "grid gap-6" : "hidden"} lg:contents`}>
            <section>
              <h3 className="font-body text-sm font-semibold mb-2.5" style={{ color: UI.ink }}>3. Choose a style <span className="font-normal" style={{ color: UI.inkSoft }}>(optional)</span></h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => setForm((f) => ({ ...f, layout: "bold" }))}
                  className="text-left p-3 rounded-lg border transition font-body text-xs"
                  style={{ borderColor: form.layout === "bold" ? ACCENT : UI.line, background: form.layout === "bold" ? UI.card : "transparent" }}>
                  <span className="font-semibold block">Bold</span>
                  <span style={{ color: UI.inkSoft }}>Photo + headline overlay</span>
                </button>
                <button onClick={() => setForm((f) => ({ ...f, layout: "editorial" }))}
                  className="text-left p-3 rounded-lg border transition font-body text-xs"
                  style={{ borderColor: form.layout === "editorial" ? ACCENT : UI.line, background: form.layout === "editorial" ? UI.card : "transparent" }}>
                  <span className="font-semibold block">Editorial</span>
                  <span style={{ color: UI.inkSoft }}>Hero photo, stats row, photo strip</span>
                </button>
                <button onClick={() => setForm((f) => ({ ...f, layout: "collage" }))}
                  className="text-left p-3 rounded-lg border transition font-body text-xs"
                  style={{ borderColor: form.layout === "collage" ? ACCENT : UI.line, background: form.layout === "collage" ? UI.card : "transparent" }}>
                  <span className="font-semibold block">Collage</span>
                  <span style={{ color: UI.inkSoft }}>Offset photos + signature</span>
                </button>
                <button onClick={() => setForm((f) => ({ ...f, layout: "modern" }))}
                  className="text-left p-3 rounded-lg border transition font-body text-xs"
                  style={{ borderColor: form.layout === "modern" ? ACCENT : UI.line, background: form.layout === "modern" ? UI.card : "transparent" }}>
                  <span className="font-semibold block">Modern</span>
                  <span style={{ color: UI.inkSoft }}>Script headline + 4-up photo strip</span>
                </button>
              </div>
            </section>

            <label
              className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer"
              style={{ borderColor: UI.line, background: UI.card }}
            >
              <input type="checkbox" checked={wantSocialSet} onChange={(e) => setWantSocialSet(e.target.checked)} className="hidden" />
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Create My Social Set</span>
                  <span className="font-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.04em", color: WHITE, background: ACCENT, padding: "1px 6px", borderRadius: 999 }}>NEW</span>
                </span>
                <span className="font-body text-xs block mt-0.5" style={{ color: UI.inkSoft }}>Get square, story, and landscape versions in seconds.</span>
              </span>
              <span
                className="flex-shrink-0 rounded-full transition"
                style={{ width: 40, height: 24, background: wantSocialSet ? ACCENT : UI.line, position: "relative" }}
              >
                <span
                  className="absolute rounded-full transition"
                  style={{ width: 18, height: 18, top: 3, left: wantSocialSet ? 19 : 3, background: WHITE }}
                />
              </span>
            </label>

            <button
              type="button"
              onClick={() => setShowCustomize((s) => !s)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border font-body text-sm font-semibold transition"
              style={{ borderColor: UI.line, color: UI.ink }}
            >
              <SlidersHorizontal size={15} />
              {showCustomize ? "Hide customize options" : "Customize More"}
            </button>

            {showCustomize && (
              <div className="grid gap-5">
                <Accordion title="Customize design" subtitle="Colors, wording, banners, badge" defaultOpen>
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

              <div className="md:col-span-2">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>ACCENT FONT</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SCRIPT_FONTS.map((f) => (
                    <button key={f.name} onClick={() => setForm((prev) => ({ ...prev, scriptFont: f.name }))}
                      className="text-left p-2.5 rounded border transition"
                      style={{ borderColor: form.scriptFont === f.name ? ACCENT : UI.line, background: form.scriptFont === f.name ? UI.card : "transparent" }}>
                      <span style={{ fontFamily: `"${f.name}", ${f.fallback}`, fontWeight: f.weight, fontSize: "1.15rem", color: UI.ink, lineHeight: 1.2, display: "block" }}>
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {form.layout === "bold" && (
                <label className="block md:col-span-2">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE</span>
                  <input className="input" value={`${form.word1} ${form.script}`.trim()}
                    onChange={(e) => {
                      const { lead, emphasis } = splitHeadlineLastWord(e.target.value);
                      setForm((f) => ({ ...f, word1: lead, script: emphasis }));
                    }} placeholder="Just SOLD!" />
                  <span className="font-body text-xs block mt-1" style={{ color: UI.inkSoft }}>The last word gets your accent color and accent font.</span>
                </label>
              )}

              {(form.layout === "editorial" || form.layout === "collage") && (
                <label className="block md:col-span-2">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE</span>
                  <input className="input" value={form.bigHeadline} onChange={update("bigHeadline")} placeholder={form.layout === "editorial" ? "JUST LISTED" : "FOR SALE"} />
                </label>
              )}

              {form.layout === "modern" && (
                <label className="block md:col-span-2">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE</span>
                  <input className="input" value={`${form.modernScript} ${form.modernHeadline}`.trim()}
                    onChange={(e) => {
                      const { emphasis, lead } = splitHeadlineFirstWord(e.target.value);
                      setForm((f) => ({ ...f, modernScript: emphasis, modernHeadline: lead }));
                    }} placeholder="just Listed" />
                  <span className="font-body text-xs block mt-1" style={{ color: UI.inkSoft }}>The first word gets the accent font treatment.</span>
                </label>
              )}

              {form.layout === "modern" && (
                <label className="block md:col-span-2">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BOTTOM BAR MESSAGE</span>
                  <input className="input" value={form.bottomMessage} onChange={update("bottomMessage")} placeholder="Message for more details" />
                </label>
              )}

              {form.layout === "bold" && (
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TOP BANNER (optional)</span>
                  <input className="input" value={form.banner} onChange={update("banner")} placeholder="$571,000 in 8 days!" />
                </label>
              )}

              {form.layout === "bold" && (
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HIGHLIGHT LINE (optional)</span>
                  <input className="input" value={form.highlight} onChange={update("highlight")} placeholder="Highest Sale Price in the Community!" />
                </label>
              )}

              {form.layout === "bold" && (
                <label className="block md:col-span-2">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PERSONAL NOTE</span>
                  <textarea className="input" rows={3} value={form.badgeText} onChange={update("badgeText")} />
                </label>
              )}

              <div>
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CONTACT BAND</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm((f) => ({ ...f, contactBg: "black" }))}
                    className="p-2 rounded border font-body text-xs font-semibold transition"
                    style={{ borderColor: form.contactBg === "black" ? ACCENT : UI.line, background: form.contactBg === "black" ? UI.card : "transparent" }}>
                    Black background
                  </button>
                  <button onClick={() => setForm((f) => ({ ...f, contactBg: "white" }))}
                    className="p-2 rounded border font-body text-xs font-semibold transition"
                    style={{ borderColor: form.contactBg === "white" ? ACCENT : UI.line, background: form.contactBg === "white" ? UI.card : "transparent" }}>
                    White background
                  </button>
                </div>
              </div>

              <div>
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SIZE (for single-image download)</span>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ASPECTS).map(([key, a]) => (
                    <button key={key} onClick={() => setForm((f) => ({ ...f, aspect: key }))}
                      className="p-2 rounded border font-body text-xs font-semibold transition"
                      style={{ borderColor: form.aspect === key ? ACCENT : UI.line, background: form.aspect === key ? UI.card : "transparent" }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
                </Accordion>

              <Accordion title="Brand settings" subtitle="Set this up once — it carries to every post">
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <UploadBox label="HEADSHOT" icon={User} state={headshot} hint="Your photo" />
              <UploadBox label="LOGO" icon={Building2} state={logo} hint="Brokerage logo" />
            </div>
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
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OFFICE PHONE</span>
              <input className="input" value={form.officePhone} onChange={update("officePhone")} />
            </label>
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>WEBSITE</span>
              <input className="input" value={form.website} onChange={update("website")} />
            </label>
            <label className="block col-span-2">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>LICENSE NUMBER</span>
              <input className="input" value={form.licenseNumber} onChange={update("licenseNumber")} />
            </label>
            <div className="col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveBrand}
                disabled={brandStatus === "saving"}
                className="font-body text-xs font-semibold rounded px-4 py-2 transition disabled:opacity-60"
                style={{ background: ACCENT, color: WHITE }}
              >
                {brandStatus === "saving" ? "Saving…" : "Save brand settings"}
              </button>
              {brandStatus === "saved" && (
                <span className="font-body text-xs" style={{ color: UI.inkSoft }}>Saved to your account.</span>
              )}
              {brandStatus === "error" && (
                <span className="font-body text-xs" style={{ color: "#C0392B" }}>Couldn't save — try again.</span>
              )}
            </div>
                </Accordion>
              </div>
            )}

            <div className="lg:hidden flex items-center gap-2">
              <button type="button" onClick={() => setMobileStep(1)}
                className="py-2.5 px-4 rounded-lg border font-body font-semibold text-sm transition"
                style={{ borderColor: UI.line, color: UI.ink }}>
                Back
              </button>
              <button type="button" onClick={() => setMobileStep(3)}
                className="flex-1 py-2.5 rounded-lg font-body font-semibold text-sm transition"
                style={{ background: ACCENT, color: WHITE }}>
                Continue to Preview &amp; Download
              </button>
            </div>
            </div>
          </div>

          {/* RIGHT: PREVIEW */}
          <div className={mobileStep === 3 ? "lg:sticky" : "hidden lg:block lg:sticky"} style={{ top: "1.5rem" }}>
            {mobileStep === 3 && (
              <button type="button" onClick={() => setMobileStep(2)}
                className="lg:hidden flex items-center gap-1.5 font-body text-sm font-semibold mb-2"
                style={{ color: UI.inkSoft }}>
                ← Back to Customize
              </button>
            )}
            <div className="rounded-2xl border p-2.5 sm:p-6" style={{ background: UI.card, borderColor: UI.line }}>
              <div className="flex items-center justify-between mb-2.5 sm:mb-4 flex-wrap gap-2">
                <span className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Preview</span>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 p-1 rounded-xl" style={{ background: UI.stone }}>
                  {Object.entries(ASPECTS).map(([key, a]) => (
                    <button key={key} onClick={() => setForm((f) => ({ ...f, aspect: key }))}
                      className="px-3 py-1 rounded-lg font-body text-xs font-semibold transition text-center"
                      style={{
                        background: form.aspect === key ? UI.card : "transparent",
                        color: form.aspect === key ? UI.ink : UI.inkSoft,
                        boxShadow: form.aspect === key ? "0 1px 3px rgba(27,36,48,0.15)" : "none",
                      }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border flex items-center justify-center p-2 sm:p-4" style={{ background: UI.stone, borderColor: UI.line }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "480px",
                    height: "auto",
                    borderRadius: "4px",
                    boxShadow: "0 20px 40px rgba(27,36,48,0.22)",
                  }}
                />
              </div>

              <button
                onClick={downloadImage}
                disabled={downloading}
                className="w-full mt-2.5 sm:mt-4 py-3 rounded-lg font-body font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
                style={{ background: ACCENT, color: WHITE }}
              >
                <Download size={16} /> {downloading ? "Preparing…" : "Download Image"}
              </button>
              {downloadError && (
                <p className="font-body text-xs mt-2" style={{ color: ERROR }}>{downloadError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
        <div className="mt-8">
          <PrivacyBadge />
        </div>

        {/* SOCIAL SET PREVIEW */}
        <div className="mt-10">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h3 className="font-body text-base font-semibold flex items-center gap-2" style={{ color: UI.ink }}>
                Your Social Set (Preview)
                <span className="font-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.04em", color: WHITE, background: ACCENT, padding: "1px 6px", borderRadius: 999 }}>NEW</span>
              </h3>
              <p className="font-body text-xs mt-1" style={{ color: UI.inkSoft }}>We'll generate multiple sizes for all your platforms.</p>
            </div>
            <button
              onClick={downloadAllSizes}
              disabled={downloadingAll}
              className="flex items-center gap-1.5 py-2 px-4 rounded-lg border font-body text-xs font-semibold transition disabled:opacity-60"
              style={{ borderColor: UI.line, color: UI.ink }}
            >
              {downloadingAll ? "Preparing…" : "Download All"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THUMB_ASPECTS.map((key) => (
              <div key={key}>
                <div className="rounded-lg border overflow-hidden flex items-center justify-center p-2" style={{ background: UI.card, borderColor: UI.line }}>
                  <canvas
                    ref={(el) => { thumbRefs.current[key] = el; }}
                    style={{ display: "block", width: "100%", height: "auto", borderRadius: "3px" }}
                  />
                </div>
                <p className="font-body text-xs font-semibold mt-2" style={{ color: UI.ink }}>{ASPECTS[key].label}</p>
                <p className="font-mono text-xs" style={{ color: UI.inkSoft }}>{ASPECTS[key].w} x {ASPECTS[key].h}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
