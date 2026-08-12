import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Image as ImageIcon, User, Building2 } from "lucide-react";
import {
  UI, PINK, BLACK, WHITE, ASPECTS, ACCENT_PRESETS,
  DEFAULT_HEADSHOT_URL, DEFAULT_LOGO_URL,
  mixWithWhite, drawCover, wrapText, roundRect, archedRect,
  useUploadedImage, useAgentAsset, UploadBox, TopNav,
} from "./shared.jsx";

const TEMPLATES = {
  sold: { word1: "Just", script: "SOLD!", badge: "Another Home\nSold by\nBilly Jo" },
  just_listed: { word1: "Just", script: "Listed!", badge: "New on the\nMarket with\nBilly Jo" },
  open_house: { word1: "Open", script: "House!", badge: "See You\nThere with\nBilly Jo" },
  price_improvement: { word1: "New", script: "Price!", badge: "Priced to\nMove with\nBilly Jo" },
  under_contract: { word1: "Under", script: "Contract!", badge: "Another One\nUnder Contract" },
  coming_soon: { word1: "Coming", script: "Soon!", badge: "Coming Soon\nwith\nBilly Jo" },
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
  badgeText: "Another Home\nSold by\nBilly Jo",
  modernScript: "just",
  modernHeadline: "Listed",
  bottomMessage: "Message for more details",
  agentName: "Billy Jo Salkowski, Realtor",
  agentPhone: "(610) 308-5894",
  agentEmail: "billyjosalkowski@gmail.com",
  brokerageName: "RE/MAX Main Line",
  brokerageCity: "Kimberton",
  officePhone: "(610) 489-5900",
  contactBg: "white",
  accentColor: "#E0298C",
};

export function ListingTool({ onSwitchTool }) {
  const [form, setForm] = useState(DEFAULTS);
  const [fontsReady, setFontsReady] = useState(false);
  const canvasRef = useRef(null);
  const photo = useUploadedImage();
  const photo2 = useUploadedImage();
  const photo3 = useUploadedImage();
  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Billy Jo headshot");
  const logo = useAgentAsset(DEFAULT_LOGO_URL, "RE/MAX Achievers logo");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    Promise.all([
      document.fonts.load('900 60px "Playfair Display"'),
      document.fonts.load('700 40px "Dancing Script"'),
      document.fonts.load('800 30px "Montserrat"'),
      document.fonts.load('600 16px "Public Sans"'),
    ]).catch(() => {}).finally(() => setFontsReady(true));
  }, []);

  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    setForm((f) => ({ ...f, template: key, word1: t.word1, script: t.script, badgeText: t.badge }));
  };

  const drawBoldLayout = (ctx, w, h) => {
    const addressH = h * 0.075;
    const contactH = h * 0.165;
    const photoH = h - addressH - contactH;

    // ---- Photo ----
    if (photo.img) {
      drawCover(ctx, photo.img, 0, 0, w, photoH);
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
    ctx.font = `700 ${scriptSize}px "Dancing Script", cursive`;
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

    ctx.font = `700 ${scriptSize}px "Dancing Script", cursive`;
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

    // ---- Contact band ----
    const contactY0 = photoH + addressH;
    const isDark = form.contactBg === "black";
    ctx.fillStyle = isDark ? BLACK : WHITE;
    ctx.fillRect(0, contactY0, w, contactH);
    const contactTextColor = isDark ? WHITE : BLACK;

    const circleD = headshot.img ? contactH * 0.82 : 0;
    const circleCX = w - w * 0.03 - circleD / 2;
    const circleCY = contactY0 + contactH / 2;
    const headshotX = circleCX - circleD / 2; // left edge, used below for text width + badge position

    if (headshot.img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(circleCX, circleCY, circleD / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // Zoom into the shorter side so the face fills the circle instead of
      // showing the full frame (which leaves the face sitting high above
      // excess shoulder/torso space) — a plain "cover" crop is a no-op
      // whenever the source image is already square, like the default photo.
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

    // Name
    const nameSize = fitFont(form.agentName, 800, contactH * 0.175);
    const nameY = contactY0 + contactH * 0.32;
    ctx.fillStyle = contactTextColor;
    ctx.fillText(form.agentName, textStartX, nameY);

    // Short pink underline beneath the name
    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = Math.max(2, w * 0.0035);
    ctx.beginPath();
    ctx.moveTo(textStartX, nameY + contactH * 0.075);
    ctx.lineTo(textStartX + w * 0.055, nameY + contactH * 0.075);
    ctx.stroke();

    // Phone  •  Email (two-color, same line)
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

    // Brokerage · City
    const brokerLine = [form.brokerageName, form.brokerageCity].filter(Boolean).join("   ·   ");
    if (brokerLine) {
      fitFont(brokerLine, 700, contactH * 0.115);
      ctx.fillStyle = contactTextColor;
      ctx.fillText(brokerLine, textStartX, contactY0 + contactH * 0.76);
    }

    // Office phone — small, muted caption
    if (form.officePhone) {
      const officeText = `Office  ${form.officePhone}`;
      fitFont(officeText, 500, contactH * 0.09);
      ctx.fillStyle = mutedColor;
      ctx.fillText(officeText, textStartX, contactY0 + contactH * 0.9);
    }

    // ---- Pink badge: top-right corner of the property photo ----
    if (form.badgeText) {
      const badgeLines = form.badgeText.split("\n").filter(Boolean);
      const margin = w * 0.045;
      const availableW = w * 0.5;

      let badgeFont = h * 0.032;
      const measure = (font) => {
        ctx.font = `700 ${font}px "Dancing Script", cursive`;
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
      ctx.font = `700 ${badgeFont}px "Dancing Script", cursive`;
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
    if (photo.img) drawCover(ctx, photo.img, 0, heroY, w, heroH);
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

    const footerH = h * 0.075;
    const stripY0 = statsY0 + statsH + h * 0.02;
    const stripH = h - stripY0 - h * 0.015 - footerH;
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
    ctx.textAlign = "center";
    ctx.font = `700 ${footerH * 0.26}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.ink;
    ctx.fillText(form.agentName, w / 2, footerY0 + footerH * 0.32);
    ctx.font = `500 ${footerH * 0.2}px "Montserrat", sans-serif`;
    ctx.fillStyle = form.accentColor;
    const line2 = [form.agentPhone, form.agentEmail].filter(Boolean).join("   •   ");
    ctx.fillText(line2, w / 2, footerY0 + footerH * 0.62);
    ctx.font = `500 ${footerH * 0.18}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.inkSoft;
    ctx.fillText(form.brokerageName, w / 2, footerY0 + footerH * 0.88);
    ctx.textAlign = "left";
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

    const collageY0 = topH;
    const collageH = h * 0.58;
    const pad = w * 0.06;
    const mainW = w * 0.56 - pad;
    const sideW = w - pad * 2 - mainW - w * 0.02;
    const sideX = pad + mainW + w * 0.02;
    const sideTileH = (collageH - w * 0.02) / 2;

    if (photo.img) drawCover(ctx, photo.img, pad, collageY0, mainW, collageH);
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
    const sigH = h - sigY0;

    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.06, sigY0 + sigH * 0.12);
    ctx.lineTo(w / 2 + w * 0.06, sigY0 + sigH * 0.12);
    ctx.stroke();

    ctx.fillStyle = form.accentColor;
    ctx.font = `italic 700 ${sigH * 0.42}px "Playfair Display", serif`;
    ctx.textAlign = "center";
    ctx.fillText(form.agentName.replace(/, Realtor$/i, ""), w / 2, sigY0 + sigH * 0.5);
    ctx.font = `600 ${sigH * 0.13}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.ink;
    ctx.fillText("REAL ESTATE AGENT", w / 2, sigY0 + sigH * 0.68);
    ctx.font = `500 ${sigH * 0.14}px "Montserrat", sans-serif`;
    const collageContact = [form.agentPhone, form.agentEmail].filter(Boolean).join("   •   ");
    ctx.fillText(collageContact, w / 2, sigY0 + sigH * 0.86);
    ctx.textAlign = "left";
  };

  // ---- Modern layout: script + serif headline, stat line, 4-up photo strip (incl. headshot), black message bar ----
  const drawModernLayout = (ctx, w, h) => {
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, w, h);

    // Fixed-height bands from the bottom up; the hero photo takes whatever's left.
    const headlineH = h * 0.145;
    const stripGap = h * 0.045;
    const stripH = h * 0.22;
    const barH = h * 0.09;
    const heroH = h - headlineH - stripGap - stripH - barH;

    if (photo.img) drawCover(ctx, photo.img, 0, 0, w, heroH);
    else { ctx.fillStyle = "#D8CFC9"; ctx.fillRect(0, 0, w, heroH); }

    // ---- Headline: cursive "just" + letter-spaced serif "LISTED" ----
    const headlineY0 = heroH;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    let scriptSize = headlineH * 0.62;
    let capsSize = headlineH * 0.4;
    const gap = w * 0.02;
    const spacedCaps = () => form.modernHeadline.toUpperCase().split("").join(" ");

    ctx.font = `700 ${scriptSize}px "Dancing Script", cursive`;
    let scriptW = ctx.measureText(form.modernScript).width;
    ctx.font = `700 ${capsSize}px "Playfair Display", serif`;
    let capsW = ctx.measureText(spacedCaps()).width;
    const headlineMaxW = w * 0.86;
    const headlineTotalW = scriptW + gap + capsW;
    if (headlineTotalW > headlineMaxW) {
      const scale = headlineMaxW / headlineTotalW;
      scriptSize *= scale;
      capsSize *= scale;
      ctx.font = `700 ${scriptSize}px "Dancing Script", cursive`;
      scriptW = ctx.measureText(form.modernScript).width;
      ctx.font = `700 ${capsSize}px "Playfair Display", serif`;
      capsW = ctx.measureText(spacedCaps()).width;
    }

    let hx = w / 2 - (scriptW + gap + capsW) / 2;
    const hy = headlineY0 + headlineH * 0.64;
    ctx.font = `700 ${scriptSize}px "Dancing Script", cursive`;
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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = ASPECTS[form.aspect];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (form.layout === "editorial") drawEditorialLayout(ctx, w, h);
    else if (form.layout === "collage") drawCollageLayout(ctx, w, h);
    else if (form.layout === "modern") drawModernLayout(ctx, w, h);
    else drawBoldLayout(ctx, w, h);
  }, [form, photo.img, photo2.img, photo3.img, headshot.img, logo.img]);

  useEffect(() => { if (fontsReady) draw(); }, [draw, fontsReady]);

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
      <TopNav active="listings" onSwitch={onSwitchTool} />


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
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>LAYOUT</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => setForm((f) => ({ ...f, layout: "bold" }))}
                className="text-left p-3 rounded border transition font-body text-xs"
                style={{ borderColor: form.layout === "bold" ? PINK : UI.line, background: form.layout === "bold" ? UI.card : "transparent" }}>
                <span className="font-semibold block">Bold Band</span>
                <span style={{ color: UI.inkSoft }}>Photo + headline overlay + contact strip</span>
              </button>
              <button onClick={() => setForm((f) => ({ ...f, layout: "editorial" }))}
                className="text-left p-3 rounded border transition font-body text-xs"
                style={{ borderColor: form.layout === "editorial" ? PINK : UI.line, background: form.layout === "editorial" ? UI.card : "transparent" }}>
                <span className="font-semibold block">Just Listed</span>
                <span style={{ color: UI.inkSoft }}>Hero photo, stats row, photo strip</span>
              </button>
              <button onClick={() => setForm((f) => ({ ...f, layout: "collage" }))}
                className="text-left p-3 rounded border transition font-body text-xs"
                style={{ borderColor: form.layout === "collage" ? PINK : UI.line, background: form.layout === "collage" ? UI.card : "transparent" }}>
                <span className="font-semibold block">Collage</span>
                <span style={{ color: UI.inkSoft }}>Offset photos + signature</span>
              </button>
              <button onClick={() => setForm((f) => ({ ...f, layout: "modern" }))}
                className="text-left p-3 rounded border transition font-body text-xs"
                style={{ borderColor: form.layout === "modern" ? PINK : UI.line, background: form.layout === "modern" ? UI.card : "transparent" }}>
                <span className="font-semibold block">Modern</span>
                <span style={{ color: UI.inkSoft }}>Script headline + 4-up photo strip</span>
              </button>
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

          <UploadBox label="PROPERTY PHOTO" icon={ImageIcon} state={photo} hint="Drop or click to add the main photo" />

          {form.layout !== "bold" && (
            <div className="grid grid-cols-2 gap-3">
              <UploadBox label={form.layout === "collage" ? "PHOTO 2 (top right)" : "PHOTO 2 (strip)"} icon={ImageIcon} state={photo2} hint="Second photo" />
              <UploadBox label={form.layout === "collage" ? "PHOTO 3 (bottom right)" : "PHOTO 3 (strip)"} icon={ImageIcon} state={photo3} hint="Third photo" />
            </div>
          )}

          {form.layout === "bold" && (
            <div className="grid grid-cols-2 gap-3">
              <UploadBox label="HEADSHOT" icon={User} state={headshot} hint="Your photo" />
              <UploadBox label="LOGO" icon={Building2} state={logo} hint="Brokerage logo" />
            </div>
          )}

          {form.layout === "modern" && (
            <UploadBox label="HEADSHOT (4th strip photo)" icon={User} state={headshot} hint="Your photo" />
          )}

          {(form.layout === "editorial" || form.layout === "collage") && (
            <label className="block">
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>
                {form.layout === "editorial" ? "HEADLINE" : "TOP HEADLINE"}
              </span>
              <input className="input" value={form.bigHeadline} onChange={update("bigHeadline")} placeholder={form.layout === "editorial" ? "JUST LISTED" : "FOR SALE"} />
            </label>
          )}

          {form.layout === "editorial" && (
            <div className="grid grid-cols-4 gap-2">
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
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SCRIPT WORD</span>
                  <input className="input" value={form.modernScript} onChange={update("modernScript")} placeholder="just" />
                </label>
                <label className="block">
                  <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE WORD</span>
                  <input className="input" value={form.modernHeadline} onChange={update("modernHeadline")} placeholder="Listed" />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
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
              <label className="block md:col-span-2">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BOTTOM BAR MESSAGE</span>
                <input className="input" value={form.bottomMessage} onChange={update("bottomMessage")} placeholder="Message for more details" />
              </label>
            </>
          )}

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>ADDRESS</span>
            <input className="input" value={form.address} onChange={update("address")} />
          </label>

          <div style={{ display: form.layout === "bold" ? "contents" : "none" }}>
          <div>
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TEMPLATE</span>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button key={key} onClick={() => applyTemplate(key)}
                  className="text-left p-2 rounded border transition font-body text-xs font-semibold"
                  style={{ borderColor: form.template === key ? PINK : UI.line, background: form.template === key ? UI.card : "transparent" }}>
                  {t.word1} {t.script}
                </button>
              ))}
            </div>
          </div>

          <div>
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

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TOP BANNER (optional)</span>
            <input className="input" value={form.banner} onChange={update("banner")} placeholder="$571,000 in 8 days!" />
          </label>

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HIGHLIGHT LINE (optional)</span>
            <input className="input" value={form.highlight} onChange={update("highlight")} placeholder="Highest Sale Price in the Community!" />
          </label>

          <label className="block">
            <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CORNER BADGE TEXT</span>
            <textarea className="input" rows={3} value={form.badgeText} onChange={update("badgeText")} />
          </label>

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
