import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Image as ImageIcon, User, Building2, Sparkles, SlidersHorizontal, Check, Copy } from "lucide-react";
import {
  UI, ACCENT, ERROR, BLACK, WHITE, ASPECTS, ACCENT_PRESETS, SCRIPT_FONTS, scriptFontCss,
  DEFAULT_HEADSHOT_URL, DEFAULT_LOGO_URL, DEFAULT_HOUSE_URL,
  mixWithWhite, drawCover, wrapText, roundRect, drawContactBand,
  useUploadedImage, useAgentAsset, UploadBox, PhotoReposition, TopNav, isMobileDevice,
  Accordion, PrivacyBadge, splitHeadlineLastWord, drawHouseBackdrop, useDefaultImage, firstNameOf,
} from "./shared.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

function drawStarPath(ctx, cx, cy, r) {
  const spikes = 5;
  const step = Math.PI / spikes;
  let rot = -Math.PI / 2;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * (r * 0.42), cy + Math.sin(rot) * (r * 0.42));
    rot += step;
  }
  ctx.closePath();
}

function drawCheckIcon(ctx, cx, cy, r, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = Math.max(1.5, r * 0.18);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.05);
  ctx.lineTo(cx - r * 0.12, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.32);
  ctx.stroke();
}

function drawHouseIcon(ctx, x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.08, y + size * 0.5);
  ctx.lineTo(x + size * 0.5, y + size * 0.08);
  ctx.lineTo(x + size * 0.92, y + size * 0.5);
  ctx.stroke();
  ctx.strokeRect(x + size * 0.2, y + size * 0.5, size * 0.6, size * 0.42);
}

// Four kinds of community goodwill posts — each just changes the headline,
// script word, corner badge, and the placeholder copy in the body field.
const TEMPLATES = {
  spotlight: {
    label: "Local Spotlight",
    word1: "Local",
    script: "Favorite!",
    badge: "Shared with\nlove by\n{agent}",
    subjectLabel: "BUSINESS NAME",
    subjectPlaceholder: "The Kettle & Vine",
    bodyLabel: "WHY YOU LOVE IT",
    bodyPlaceholder: "Best cortado in Warminster, and they remember your order every time!",
  },
  reno_tip: {
    label: "Reno Tip",
    word1: "Reno",
    script: "Tip!",
    badge: "Home Tip\nfrom\n{agent}",
    subjectLabel: "TIP TITLE",
    subjectPlaceholder: "Caulk Your Baseboards",
    bodyLabel: "THE TIP",
    bodyPlaceholder: "A $6 tube of caulk along the baseboards makes a room look freshly renovated in under an hour.",
  },
  paint: {
    label: "Paint Pick",
    word1: "Paint",
    script: "Pick!",
    badge: "Color of the\nSeason from\n{agent}",
    subjectLabel: "COLOR NAME",
    subjectPlaceholder: "Sherwin-Williams ‘Evergreen Fog’",
    bodyLabel: "WHY IT WORKS",
    bodyPlaceholder: "A moody sage that photographs beautifully for listing photos and pairs with almost any trim white.",
  },
  recipe: {
    label: "Recipe",
    word1: "Try This",
    script: "Recipe!",
    badge: "Kitchen\nFavorite from\n{agent}",
    subjectLabel: "RECIPE NAME",
    subjectPlaceholder: "Sheet-Pan Fall Veggies",
    bodyLabel: "THE RECIPE",
    bodyPlaceholder: "Toss squash, carrots, and red onion in olive oil, maple syrup, and thyme. Roast at 425° for 30 minutes.",
  },
  neighborhood: {
    label: "Neighborhood Guide",
    word1: "Neighborhood",
    script: "Guide!",
    badge: "Your Guide\nto the Area\nfrom {agent}",
    subjectLabel: "NEIGHBORHOOD NAME",
    subjectPlaceholder: "Chestnut Hill",
    bodyLabel: "WHAT TO KNOW",
    bodyPlaceholder: "Walkable downtown, top-rated schools, and a farmers market every Saturday from May through October.",
  },
  home_value: {
    label: "Home Value Tip",
    word1: "Value",
    script: "Tip!",
    badge: "Home Value\nTip from\n{agent}",
    subjectLabel: "TIP TITLE",
    subjectPlaceholder: "Skip the Full Kitchen Remodel",
    bodyLabel: "THE TIP",
    bodyPlaceholder: "A full kitchen remodel rarely returns more than 60% at resale — fresh paint and new hardware often does more per dollar.",
  },
  design_trend: {
    label: "Design Trend",
    word1: "Design",
    script: "Trend!",
    badge: "Trending Now\nfrom\n{agent}",
    subjectLabel: "TREND NAME",
    subjectPlaceholder: "Warm Minimalism",
    bodyLabel: "WHY IT'S TRENDING",
    bodyPlaceholder: "Soft neutrals, natural wood tones, and curved furniture — the “cozy but clean” look buyers keep asking for.",
  },
};

// Visual structures a post can take — independent of TEMPLATES above, which
// only supplies headline copy for the "card" style.
const STYLES = {
  card: { label: "Classic Card", description: "Photo, headline band, description" },
  tips: { label: "Tip List", description: "Title band + list over a photo" },
  testimonial: { label: "Testimonial", description: "Star rating + client quote" },
  stats: { label: "Big Number List", description: "Big numeral + icon list" },
  checklist: { label: "Checklist", description: "Headline card + checkmarks" },
  quote: { label: "Quote Card", description: "Big pull-quote + your message" },
  poll: { label: "This or That", description: "Two-option compare card" },
};

// Broader groupings the individual TEMPLATES sit under — agents pick a
// category first, then a specific idea within it, instead of scanning a
// flat grid of every template at once.
const CATEGORIES = {
  local: {
    icon: "📍", label: "Local & Trending",
    description: "Restaurants, businesses & events",
    options: ["spotlight", "neighborhood"],
  },
  client_love: {
    icon: "⭐", label: "Client Love",
    description: "Testimonials, reviews, closing stories",
    isTestimonial: true,
  },
  design: {
    icon: "🎨", label: "Design & Home",
    description: "Trends, decor & renovation",
    options: ["design_trend", "paint", "reno_tip"],
  },
  tips: {
    icon: "💡", label: "Buyer & Seller Tips",
    description: "Education that builds trust",
    options: ["home_value"],
  },
  personal: {
    icon: "👋", label: "Personal & Community",
    description: "Recipes, life, and local flavor",
    options: ["recipe"],
  },
};

// A short, category-appropriate hashtag set for the caption composer below —
// deterministic, not AI-generated, so it never invents a claim about the post.
const CATEGORY_HASHTAGS = {
  local: ["#ShopLocal", "#SupportSmallBusiness", "#CommunityFavorite"],
  client_love: ["#ClientLove", "#HappyClients", "#RealEstateReview"],
  design: ["#HomeDesign", "#DesignTips", "#HomeInspo"],
  tips: ["#RealEstateTips", "#HomeBuyingTips", "#HomeSellingTips"],
  personal: ["#RealEstateAgent", "#CommunityFirst", "#LocalLife"],
};

// Curated prompts for agents who know they should post but can't think of
// what — each points at the template that best fits so "Create this post"
// can jump straight into a filled-out starting point.
const IDEAS = [
  { text: "Spotlight a local coffee shop you always recommend to clients.", template: "spotlight" },
  { text: "Share a quick home-maintenance tip your clients thank you for.", template: "reno_tip" },
  { text: "Highlight a favorite restaurant in the neighborhood.", template: "spotlight" },
  { text: "Give a mini guide to a neighborhood you sell in often.", template: "neighborhood" },
  { text: "Share a home value tip that surprises people.", template: "home_value" },
  { text: "Post this season's must-try paint color.", template: "paint" },
  { text: "Share a simple recipe for the weekend.", template: "recipe" },
  { text: "Highlight a design trend your buyers keep asking about.", template: "design_trend" },
  { text: "Recommend a local park or weekend spot for families.", template: "spotlight" },
  { text: "Shout out a small business worth checking out this week.", template: "spotlight" },
];

const DEFAULTS = {
  template: "spotlight",
  style: "card",
  aspect: "square",
  word1: "Local",
  script: "Favorite!",
  badgeText: "Shared with\nlove by\n{agent}",
  subject: "The Kettle & Vine",
  body: "Best cortado in Warminster, and they remember your order every time!",
  listItems: "Turn on the AC\nOffer cold refreshments\nHighlight outdoor spaces",
  bigNumber: "5",
  quote: "Mariella was a joy to work with when I chose to sell my starter home. Her negotiation skills were amazing and we will definitely work with her in the future!",
  clientName: "Mariella Torres",
  clientType: "Buyer",
  useHeadshot: true,
  rating: 5,
  quoteEyebrow: "Design Tip",
  quoteText: "A fresh coat of paint is still the highest-ROI update you can make before listing.",
  pollHeadline: "Which Kitchen Style Do You Love?",
  optionA: "Open Concept",
  optionB: "Defined Rooms",
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

export function CommunityTool({ onSwitchTool, onGoHome }) {
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
  const [brandStatus, setBrandStatus] = useState("idle");
  const canvasRef = useRef(null);
  const photo = useUploadedImage();
  const headshot = useAgentAsset(DEFAULT_HEADSHOT_URL, "Headshot", brandKit?.headshotUrl);
  const logo = useAgentAsset(DEFAULT_LOGO_URL, "Brokerage logo", brandKit?.logoUrl);
  const houseDefault = useDefaultImage(DEFAULT_HOUSE_URL);

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
      style: "card",
      word1: t.word1,
      script: t.script,
      badgeText: t.badge.replace("{agent}", firstNameOf(f.agentName)),
    }));
  };

  const categoryOfTemplate = (key) => {
    const found = Object.entries(CATEGORIES).find(([, c]) => c.options?.includes(key));
    return found ? found[0] : "local";
  };

  const [category, setCategory] = useState(() =>
    form.style === "testimonial" ? "client_love" : categoryOfTemplate(form.template)
  );

  const selectCategory = (key) => {
    setCategory(key);
    const cat = CATEGORIES[key];
    if (cat.isTestimonial) {
      setForm((f) => ({ ...f, style: "testimonial" }));
    } else if (form.style === "testimonial" || !cat.options.includes(form.template)) {
      applyTemplate(cat.options[0]);
    }
  };

  const [idea, setIdea] = useState(null);
  const giveIdea = () => {
    const others = IDEAS.filter((i) => i !== idea);
    setIdea(others[Math.floor(Math.random() * others.length)]);
  };
  const createFromIdea = () => {
    if (!idea) return;
    applyTemplate(idea.template);
    setCategory(categoryOfTemplate(idea.template));
  };

  const activeTemplate = TEMPLATES[form.template];

  // Empty-state backdrop for styles that need a full-bleed photo: the real
  // house photo (softly blurred, slightly oversized to hide blur-edge
  // transparency) once it's loaded, or the illustrated placeholder before
  // that / if it fails to load.
  const drawEmptyPhotoBackdrop = (ctx, w, h) => {
    if (houseDefault) {
      ctx.save();
      ctx.filter = `blur(${Math.round(w * 0.012)}px)`;
      drawCover(ctx, houseDefault, -w * 0.03, -h * 0.03, w * 1.06, h * 1.06);
      ctx.restore();
    } else {
      drawHouseBackdrop(ctx, w, h);
    }
  };

  // ---- Tip List: title band + list, over a full-bleed photo ----
  const drawTipsStyle = (ctx, w, h) => {
    const contactH = Math.min(w, h) * 0.145;

    if (photo.img) {
      ctx.save();
      ctx.filter = `blur(${Math.round(w * 0.012)}px)`;
      drawCover(ctx, photo.img, -w * 0.03, -h * 0.03, w * 1.06, h * 1.06, photo.focus.x, photo.focus.y, photo.zoom);
      ctx.restore();
    } else drawEmptyPhotoBackdrop(ctx, w, h);

    const bandX = w * 0.08, bandW = w * 0.84;
    const bandY = h * 0.1;
    const titleSize = h * 0.034;
    ctx.font = `700 ${titleSize}px "Montserrat", sans-serif`;
    ctx.textAlign = "center";
    const titleLines = wrapText(ctx, (form.subject || "").toUpperCase(), bandW * 0.82);
    const titleLineH = titleSize * 1.5;
    const bandH = titleLineH * titleLines.length + h * 0.05;

    ctx.fillStyle = form.accentColor;
    ctx.fillRect(bandX, bandY, bandW, bandH);
    ctx.fillStyle = WHITE;
    const titleStartY = bandY + (bandH - titleLineH * titleLines.length) / 2 + titleSize * 0.85;
    titleLines.forEach((line, i) => ctx.fillText(line, w / 2, titleStartY + i * titleLineH));

    const cardY = bandY + bandH;
    const items = (form.listItems || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8);
    const itemSize = h * 0.026;
    const itemGap = h * 0.075;
    const cardPadY = h * 0.045;
    const cardMaxH = h - contactH - h * 0.03 - cardY;
    const cardH = Math.min(cardMaxH, Math.max(h * 0.24, cardPadY * 2 + items.length * itemGap));
    ctx.fillStyle = WHITE;
    ctx.fillRect(bandX, cardY, bandW, cardH);

    ctx.font = `600 ${itemSize}px "Montserrat", sans-serif`;
    ctx.fillStyle = UI.ink;
    let cy = cardY + cardPadY + itemSize * 0.5;
    items.forEach((item) => {
      const lines = wrapText(ctx, item.toUpperCase(), bandW * 0.8);
      lines.forEach((line, li) => ctx.fillText(line, w / 2, cy + li * itemSize * 1.35));
      cy += Math.max(itemGap, lines.length * itemSize * 1.35 + h * 0.02);
    });
    ctx.textAlign = "left";

    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo);
  };

  // ---- Testimonial: tinted quadrant background, headshot, stars, quote, signature ----
  const drawTestimonialStyle = (ctx, w, h) => {
    const tints = [0.3, 0.5, 0.15, 0.4];
    const qw = w / 2, qh = h / 2;
    [[0, 0], [qw, 0], [0, qh], [qw, qh]].forEach(([x, y], i) => {
      ctx.fillStyle = mixWithWhite(form.accentColor, tints[i]);
      ctx.fillRect(x, y, qw, qh);
    });

    const contactH = Math.min(w, h) * 0.145;
    const cardW = w * 0.74, cardH = h * 0.54;
    const cardX = (w - cardW) / 2, cardY = h * 0.16;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = w * 0.02;
    ctx.fillStyle = WHITE;
    roundRect(ctx, cardX, cardY, cardW, cardH, w * 0.012);
    ctx.fill();
    ctx.restore();

    // The client's own photo takes priority in the circle (this is their
    // testimonial); the agent headshot is only a fallback. Turning off
    // "Use headshot" skips the circle entirely and gives the quote more room.
    const circleD = w * 0.19;
    const circleCX = w / 2, circleCY = cardY;
    const circleImg = photo.img || headshot.img;
    const showCircle = form.useHeadshot !== false && !!circleImg;
    if (showCircle) {
      ctx.beginPath();
      ctx.arc(circleCX, circleCY, circleD / 2 + w * 0.012, 0, Math.PI * 2);
      ctx.fillStyle = WHITE;
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(circleCX, circleCY, circleD / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const img = circleImg;
      const shortSide = Math.min(img.width, img.height);
      const cropSize = shortSide * 0.82;
      const sx = (img.width - cropSize) / 2;
      ctx.drawImage(img, sx, 0, cropSize, cropSize, circleCX - circleD / 2, circleCY - circleD / 2, circleD, circleD);
      ctx.restore();
    }

    const starR = w * 0.02;
    const starGap = starR * 2.6;
    const rating = Math.max(0, Math.min(5, parseInt(form.rating, 10) || 0));
    let starX = w / 2 - (starGap * 4) / 2;
    const starY = showCircle ? cardY + circleD * 0.62 + h * 0.05 : cardY + h * 0.09;
    for (let i = 0; i < 5; i++) {
      drawStarPath(ctx, starX, starY, starR);
      ctx.fillStyle = i < rating ? form.accentColor : mixWithWhite(form.accentColor, 0.75);
      ctx.fill();
      starX += starGap;
    }

    ctx.textAlign = "center";
    const quoteMaxW = cardW * 0.82;
    const qy = starY + h * 0.075;
    const cardBottom = cardY + cardH;
    const sigSize = w * 0.045;
    const sigLineH = sigSize * 1.15;
    const typeSize = w * 0.018;
    const typeLineH = form.clientType ? typeSize * 1.6 : 0;
    const gapBeforeSig = h * 0.035;
    const bottomPad = h * 0.035;
    const availableH = cardBottom - qy - bottomPad - gapBeforeSig - sigLineH - typeLineH;

    // Long quotes shrink to fit above the signature; if they still don't fit
    // even at the smallest readable size, truncate with an ellipsis instead
    // of pushing the client's name down into the contact band.
    let quoteSize = w * 0.03;
    const minQuoteSize = w * 0.017;
    let quoteLines = [];
    let quoteLineH = quoteSize * 1.42;
    while (true) {
      ctx.font = `italic 500 ${quoteSize}px "Playfair Display", serif`;
      quoteLineH = quoteSize * 1.42;
      quoteLines = wrapText(ctx, `"${form.quote}"`, quoteMaxW);
      if (quoteLines.length * quoteLineH <= availableH || quoteSize <= minQuoteSize) break;
      quoteSize -= w * 0.0015;
    }
    const maxLines = Math.max(1, Math.floor(availableH / quoteLineH));
    if (quoteLines.length > maxLines) {
      quoteLines = quoteLines.slice(0, maxLines);
      quoteLines[maxLines - 1] = quoteLines[maxLines - 1].replace(/[.,;:\s]*$/, "") + "…";
    }

    ctx.font = `italic 500 ${quoteSize}px "Playfair Display", serif`;
    ctx.fillStyle = UI.ink;
    quoteLines.forEach((line, i) => ctx.fillText(line, w / 2, qy + i * quoteLineH));

    const sigY = qy + quoteLines.length * quoteLineH + gapBeforeSig;
    ctx.font = scriptFontCss(form.scriptFont, sigSize);
    ctx.fillStyle = form.accentColor;
    ctx.fillText(form.clientName, w / 2, sigY);

    if (form.clientType) {
      ctx.font = `700 ${typeSize}px "Montserrat", sans-serif`;
      ctx.fillStyle = UI.inkSoft;
      const typeLabel = form.clientType === "Seller" ? "SELLERS" : "BUYERS";
      ctx.fillText(typeLabel, w / 2, sigY + typeLineH * 0.72);
    }

    ctx.textAlign = "left";

    // Skip the agent headshot in the contact band when it's already shown
    // in the circle above, so the same photo doesn't appear twice.
    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo, !showCircle);
  };

  // ---- Big Number List: dark-tinted photo, giant numeral, headline, icon list ----
  const drawStatsStyle = (ctx, w, h) => {
    const contactH = Math.min(w, h) * 0.145;

    if (photo.img) drawCover(ctx, photo.img, 0, 0, w, h, photo.focus.x, photo.focus.y, photo.zoom);
    else drawEmptyPhotoBackdrop(ctx, w, h);
    ctx.fillStyle = "rgba(20,14,10,0.45)";
    ctx.fillRect(0, 0, w, h - contactH);

    const numSize = h * 0.3;
    ctx.font = `900 ${numSize}px "Playfair Display", serif`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    const numX = w * 0.07;
    const numY = h * 0.4;
    ctx.fillText(form.bigNumber, numX, numY);
    const numW = ctx.measureText(form.bigNumber).width;

    const headX = numX + numW + w * 0.04;
    const headSize = h * 0.032;
    ctx.font = `700 ${headSize}px "Montserrat", sans-serif`;
    const headLines = wrapText(ctx, (form.subject || "").toUpperCase(), w - headX - w * 0.06);
    const headLineH = headSize * 1.3;
    headLines.forEach((line, i) => ctx.fillText(line, headX, h * 0.16 + i * headLineH));

    const items = (form.listItems || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 7);
    const itemSize = h * 0.021;
    const itemGap = h * 0.05;
    const iconSize = h * 0.026;
    const itemMaxY = h - contactH - h * 0.04;
    let itemY = h * 0.16 + headLines.length * headLineH + h * 0.05;
    items.forEach((item) => {
      if (itemY > itemMaxY) return;
      drawHouseIcon(ctx, headX, itemY - iconSize * 0.75, iconSize, form.accentColor);
      ctx.font = `600 ${itemSize}px "Montserrat", sans-serif`;
      ctx.fillStyle = WHITE;
      const lines = wrapText(ctx, item.toUpperCase(), w - headX - iconSize * 1.4 - w * 0.06);
      lines.forEach((line, li) => ctx.fillText(line, headX + iconSize * 1.4, itemY + li * itemSize * 1.3));
      itemY += Math.max(itemGap, lines.length * itemSize * 1.3 + h * 0.015);
    });

    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo);
  };

  // ---- Checklist: photo, agent tag top-right, headline card with checkmark list ----
  const drawChecklistStyle = (ctx, w, h) => {
    const contactH = Math.min(w, h) * 0.145;

    if (photo.img) {
      ctx.save();
      ctx.filter = `blur(${Math.round(w * 0.012)}px)`;
      drawCover(ctx, photo.img, -w * 0.03, -h * 0.03, w * 1.06, h * 1.06, photo.focus.x, photo.focus.y, photo.zoom);
      ctx.restore();
    } else drawEmptyPhotoBackdrop(ctx, w, h);

    const cardW = w * 0.8, cardX = (w - cardW) / 2;
    const cardY = h * 0.26;
    const items = (form.listItems || "").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6);
    const headSize = h * 0.036;
    ctx.font = `700 ${headSize}px "Playfair Display", serif`;
    ctx.textAlign = "center";
    const headLines = wrapText(ctx, form.subject || "", cardW * 0.85);
    const headLineH = headSize * 1.25;
    const itemSize = h * 0.023;
    const itemGap = h * 0.07;
    const cardPadY = h * 0.045;
    const cardMaxH = h - contactH - h * 0.03 - cardY;
    const cardH = Math.min(cardMaxH, cardPadY * 2 + headLines.length * headLineH + h * 0.03 + items.length * itemGap);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = w * 0.015;
    ctx.fillStyle = WHITE;
    roundRect(ctx, cardX, cardY, cardW, cardH, w * 0.01);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = UI.ink;
    let cy = cardY + cardPadY + headSize * 0.85;
    headLines.forEach((line, i) => ctx.fillText(line, w / 2, cy + i * headLineH));
    cy += headLines.length * headLineH + h * 0.03;

    ctx.textAlign = "left";
    const iconR = h * 0.018;
    const textX = cardX + cardW * 0.12 + iconR * 2;
    items.forEach((item) => {
      drawCheckIcon(ctx, cardX + cardW * 0.12, cy - iconR * 0.3, iconR, form.accentColor);
      ctx.font = `600 ${itemSize}px "Montserrat", sans-serif`;
      ctx.fillStyle = UI.ink;
      const lines = wrapText(ctx, item.toUpperCase(), cardW * 0.7);
      lines.forEach((line, li) => ctx.fillText(line, textX, cy + li * itemSize * 1.3));
      cy += Math.max(itemGap, lines.length * itemSize * 1.3 + h * 0.02);
    });

    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo);
  };

  // ---- Quote Card: giant pull-quote mark, short message, optional dimmed photo backdrop ----
  const drawQuoteStyle = (ctx, w, h) => {
    const contactH = Math.min(w, h) * 0.145;

    if (photo.img) {
      ctx.save();
      ctx.filter = `blur(${Math.round(w * 0.014)}px)`;
      drawCover(ctx, photo.img, -w * 0.03, -h * 0.03, w * 1.06, h * 1.06, photo.focus.x, photo.focus.y, photo.zoom);
      ctx.restore();
      ctx.fillStyle = "rgba(20,14,10,0.5)";
      ctx.fillRect(0, 0, w, h - contactH);
    } else {
      ctx.fillStyle = mixWithWhite(form.accentColor, 0.86);
      ctx.fillRect(0, 0, w, h - contactH);
    }

    const isOnPhoto = !!photo.img;
    const inkColor = isOnPhoto ? WHITE : UI.ink;
    const softColor = isOnPhoto ? "rgba(255,255,255,0.75)" : UI.inkSoft;

    const cardW = w * 0.82, cardX = (w - cardW) / 2;
    const markSize = h * 0.16;
    const markY = h * 0.15;
    ctx.font = `900 ${markSize}px Georgia, "Playfair Display", serif`;
    ctx.fillStyle = form.accentColor;
    ctx.fillText("“", cardX - cardW * 0.02, markY);

    let afterMarkY = markY + h * 0.05;
    if (form.quoteEyebrow) {
      const eyebrowSize = h * 0.022;
      ctx.font = `700 ${eyebrowSize}px "Montserrat", sans-serif`;
      ctx.fillStyle = form.accentColor;
      ctx.textAlign = "left";
      const eyebrow = form.quoteEyebrow.toUpperCase();
      ctx.fillText(eyebrow, cardX, afterMarkY, cardW);
      afterMarkY += eyebrowSize * 1.6;
    }

    ctx.textAlign = "left";
    let quoteSize = h * 0.048;
    ctx.font = `700 ${quoteSize}px "Playfair Display", serif`;
    let lines = wrapText(ctx, form.quoteText || "", cardW);
    const maxLines = 5;
    while (lines.length > maxLines && quoteSize > h * 0.026) {
      quoteSize *= 0.92;
      ctx.font = `700 ${quoteSize}px "Playfair Display", serif`;
      lines = wrapText(ctx, form.quoteText || "", cardW);
    }
    const lineH = quoteSize * 1.32;
    const textStartY = afterMarkY + quoteSize * 0.85;
    ctx.fillStyle = inkColor;
    lines.slice(0, maxLines).forEach((line, i) => ctx.fillText(line, cardX, textStartY + i * lineH));

    const ruleY = textStartY + lines.slice(0, maxLines).length * lineH + h * 0.035;
    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(cardX, ruleY);
    ctx.lineTo(cardX + w * 0.09, ruleY);
    ctx.stroke();

    ctx.font = `600 ${h * 0.02}px "Montserrat", sans-serif`;
    ctx.fillStyle = softColor;
    ctx.fillText(`— ${firstNameOf(form.agentName)}`, cardX, ruleY + h * 0.04);

    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo);
  };

  // ---- This or That: split two-color card with a VS badge, for a quick engagement poll ----
  const drawPollStyle = (ctx, w, h) => {
    const contactH = Math.min(w, h) * 0.145;

    // Every size below is driven by width, not height: this is a two-column
    // layout, so what actually constrains it is how much text fits across
    // (or beside the badge), not the post's overall height. Sizing off `h`
    // instead would blow the type up on tall aspects like Story and either
    // push the headline off-canvas or run the options into the badge.
    let headSize = w * 0.052;
    ctx.font = `800 ${headSize}px "Montserrat", sans-serif`;
    const wrapHeadline = () => wrapText(ctx, (form.pollHeadline || "").toUpperCase(), w * 0.86);
    let headLines = wrapHeadline();
    while (headLines.length > 2 && headSize > w * 0.03) {
      headSize *= 0.9;
      ctx.font = `800 ${headSize}px "Montserrat", sans-serif`;
      headLines = wrapHeadline();
    }
    headLines = headLines.slice(0, 2);
    const headLineH = headSize * 1.3;
    const headPadY = h * 0.035;
    const headH = form.pollHeadline ? headLines.length * headLineH + headPadY * 2 : h * 0.06;

    ctx.fillStyle = UI.ink;
    ctx.fillRect(0, 0, w, headH);
    if (form.pollHeadline) {
      ctx.textAlign = "center";
      ctx.fillStyle = WHITE;
      const startY = (headH - headLines.length * headLineH) / 2 + headSize * 0.85;
      headLines.forEach((line, i) => ctx.fillText(line, w / 2, startY + i * headLineH));
    }

    const splitY0 = headH, splitH = h - contactH - headH;
    ctx.fillStyle = mixWithWhite(form.accentColor, 0.18);
    ctx.fillRect(0, splitY0, w / 2, splitH);
    ctx.fillStyle = mixWithWhite(form.accentColor, 0.55);
    ctx.fillRect(w / 2, splitY0, w / 2, splitH);

    const badgeR = w * 0.075;
    const badgeCX = w / 2, badgeCY = splitY0 + splitH / 2;
    const optionMaxW = w / 2 - badgeR - w * 0.06;

    let optionSize = w * 0.052;
    ctx.font = `800 ${optionSize}px "Playfair Display", serif`;
    const wrapOption = (text) => wrapText(ctx, (text || "").toUpperCase(), optionMaxW);
    let aLines = wrapOption(form.optionA);
    let bLines = wrapOption(form.optionB);
    while ((aLines.length > 3 || bLines.length > 3) && optionSize > w * 0.026) {
      optionSize *= 0.92;
      ctx.font = `800 ${optionSize}px "Playfair Display", serif`;
      aLines = wrapOption(form.optionA);
      bLines = wrapOption(form.optionB);
    }
    const optLineH = optionSize * 1.2;
    ctx.textAlign = "center";
    const drawOption = (lines, cx, color) => {
      const blockH = lines.length * optLineH;
      const startY = badgeCY - blockH / 2 + optionSize * 0.85;
      ctx.fillStyle = color;
      lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * optLineH));
    };
    drawOption(aLines, w * 0.25, WHITE);
    drawOption(bLines, w * 0.75, UI.ink);

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = w * 0.015;
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = form.accentColor;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.stroke();
    ctx.font = `900 ${badgeR * 0.85}px "Playfair Display", serif`;
    ctx.fillStyle = WHITE;
    ctx.fillText("VS", badgeCX, badgeCY + badgeR * 0.3);
    ctx.textAlign = "left";

    drawContactBand(ctx, w, h - contactH, contactH, form, headshot, logo);
  };

  const drawCardStyle = (ctx, w, h) => {
    const addressH = h * 0.075;
    const contactH = Math.min(w, h) * 0.165;
    const bodyH = h * 0.16;
    const photoH = h - addressH - contactH - bodyH;

    // ---- Photo ----
    if (photo.img) {
      drawCover(ctx, photo.img, 0, 0, w, photoH, photo.focus.x, photo.focus.y, photo.zoom);
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

    // ---- Corner badge ----
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

    // ---- Contact band (brokerage-required, shared across every template) ----
    const contactY0 = bodyY0 + bodyH;
    drawContactBand(ctx, w, contactY0, contactH, form, headshot, logo);
  };

  const drawToCanvas = (canvas, aspectKey) => {
    const { w, h } = ASPECTS[aspectKey];
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (form.style === "tips") drawTipsStyle(ctx, w, h);
    else if (form.style === "testimonial") drawTestimonialStyle(ctx, w, h);
    else if (form.style === "stats") drawStatsStyle(ctx, w, h);
    else if (form.style === "checklist") drawChecklistStyle(ctx, w, h);
    else if (form.style === "quote") drawQuoteStyle(ctx, w, h);
    else if (form.style === "poll") drawPollStyle(ctx, w, h);
    else drawCardStyle(ctx, w, h);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawToCanvas(canvas, form.aspect);
  }, [form, photo.img, photo.focus, photo.zoom, headshot.img, logo.img, houseDefault]);

  useEffect(() => { if (fontsReady) draw(); }, [draw, fontsReady]);

  // Small live thumbnails for the layout picker — each renders the current
  // content in that style, so picking a layout is a visual choice instead
  // of reading a description.
  const drawStyleThumb = (canvas, styleKey) => {
    if (!canvas) return;
    const { w, h } = ASPECTS.square;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    if (styleKey === "tips") drawTipsStyle(ctx, w, h);
    else if (styleKey === "testimonial") drawTestimonialStyle(ctx, w, h);
    else if (styleKey === "stats") drawStatsStyle(ctx, w, h);
    else if (styleKey === "checklist") drawChecklistStyle(ctx, w, h);
    else if (styleKey === "quote") drawQuoteStyle(ctx, w, h);
    else if (styleKey === "poll") drawPollStyle(ctx, w, h);
    else drawCardStyle(ctx, w, h);
  };
  const styleThumbRefs = useRef({});
  useEffect(() => {
    if (!fontsReady) return;
    Object.keys(STYLES).forEach((key) => drawStyleThumb(styleThumbRefs.current[key], key));
  }, [form, photo.img, photo.focus, photo.zoom, headshot.img, logo.img, houseDefault, fontsReady]);

  // Small live previews of the other sizes in the social set.
  const THUMB_ASPECTS = ["square", "story", "landscape"];
  const setThumbRefs = useRef({});
  useEffect(() => {
    if (!fontsReady) return;
    THUMB_ASPECTS.forEach((key) => {
      const canvas = setThumbRefs.current[key];
      if (canvas) drawToCanvas(canvas, key);
    });
  }, [form, photo.img, photo.focus, photo.zoom, headshot.img, logo.img, houseDefault, fontsReady]);

  const [showCustomize, setShowCustomize] = useState(false);
  const [wantSocialSet, setWantSocialSet] = useState(true);

  // On phones, only one step's content is visible at a time so getting from
  // "what are you posting" to "download" doesn't mean scrolling through
  // every section. At the `lg` breakpoint desktop keeps everything visible.
  const [mobileStep, setMobileStep] = useState(1);

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

  const downloadAllSizes = async () => {
    setDownloadingAll(true);
    setDownloadError("");
    const safeName = (form.subject || "community-post").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
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

  // A ready-to-post caption built from whatever's already on the graphic —
  // not AI-written, just assembled, so it never says something the post
  // itself doesn't.
  const buildCaption = () => {
    const tags = (CATEGORY_HASHTAGS[category] || []).join(" ");
    let lines;
    if (form.style === "testimonial") {
      lines = [`"${form.quote}"`, `— ${form.clientName}${form.clientType ? `, ${form.clientType}` : ""}`];
    } else if (form.style === "tips" || form.style === "stats" || form.style === "checklist") {
      const items = (form.listItems || "").split("\n").map((s) => s.trim()).filter(Boolean);
      lines = [form.subject, ...items.map((i) => `• ${i}`)];
    } else if (form.style === "quote") {
      lines = [form.quoteEyebrow, `"${form.quoteText}"`, `— ${firstNameOf(form.agentName)}`];
    } else if (form.style === "poll") {
      lines = [form.pollHeadline, `${form.optionA} or ${form.optionB}? Drop your pick in the comments 👇`];
    } else {
      lines = [`${form.word1} ${form.script}`.trim(), form.subject, form.body].filter(Boolean);
    }
    return [...lines.filter(Boolean), tags].filter(Boolean).join("\n\n");
  };

  const [captionCopied, setCaptionCopied] = useState(false);
  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(buildCaption());
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      setDownloadError("Couldn't copy the caption — try selecting and copying the text manually.");
    }
  };


  return (
    <div className="min-h-screen" style={{ background: UI.stone, color: UI.ink }}>
      <TopNav active="community" onSwitch={onSwitchTool} userName={user?.fullName} onLogout={logout} onLogoClick={onGoHome} />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-10">
        {/* PAGE HEADER */}
        <div className={mobileStep === 1 ? "mb-3 sm:mb-6" : "hidden lg:block lg:mb-6"}>
          <h1 className="font-display font-bold" style={{ color: UI.ink, fontSize: "1.85rem" }}>Community Posts</h1>
          <p className="font-body text-sm mt-1 hidden sm:block" style={{ color: UI.inkSoft }}>Stay visible even when you don't have a listing to share.</p>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-1 sm:gap-3 mb-5 sm:mb-8 lg:mb-8" style={{ marginBottom: mobileStep === 1 ? undefined : "0.875rem" }}>
          {[{ n: 1, label: "What to Post" }, { n: 2, label: "Customize" }, { n: 3, label: "Download" }].map((s, i, arr) => (
            <div key={s.n} className="flex items-center gap-1 sm:gap-3 min-w-0">
              <button type="button" onClick={() => setMobileStep(s.n)} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span
                  className="flex items-center justify-center rounded-full font-body text-xs font-semibold flex-shrink-0"
                  style={{
                    width: 24, height: 24,
                    background: mobileStep >= s.n ? ACCENT : "transparent",
                    color: mobileStep >= s.n ? WHITE : UI.inkSoft,
                    border: mobileStep >= s.n ? "none" : `1.5px solid ${UI.line}`,
                  }}
                >
                  {s.n}
                </span>
                <span
                  className={`font-body text-xs sm:text-sm font-semibold truncate ${mobileStep === s.n ? "" : "hidden sm:inline"}`}
                  style={{ color: mobileStep >= s.n ? UI.ink : UI.inkSoft }}
                >
                  {s.label}
                </span>
              </button>
              {i < arr.length - 1 && <div className="flex-shrink-0" style={{ width: 16, height: 1.5, background: UI.line }} />}
            </div>
          ))}
        </div>

        {/* GIVE ME AN IDEA */}
        <div className={`${mobileStep === 1 ? "flex" : "hidden lg:flex"} rounded-2xl border p-3.5 sm:p-5 mb-4 sm:mb-8 flex-col sm:flex-row sm:items-center gap-3 sm:gap-4`} style={{ background: UI.card, borderColor: UI.line }}>
          <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 40, height: 40, background: ACCENT }}>
            <Sparkles size={18} color={WHITE} />
          </div>
          <div className="flex-1">
            {idea ? (
              <>
                <p className="font-mono text-xs font-semibold" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>TODAY'S IDEA</p>
                <p className="font-body text-sm mt-0.5" style={{ color: UI.ink }}>{idea.text}</p>
              </>
            ) : (
              <>
                <p className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Not sure what to post?</p>
                <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>Get a quick idea — a coffee shop, a neighborhood tip, a weekend event.</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={giveIdea}
              className="py-2 px-4 rounded-lg border font-body text-xs font-semibold transition"
              style={{ borderColor: UI.line, color: UI.ink }}
            >
              {idea ? "Another idea" : "Give Me an Idea"}
            </button>
            {idea && (
              <button
                onClick={createFromIdea}
                className="py-2 px-4 rounded-lg font-body text-xs font-semibold transition"
                style={{ background: ACCENT, color: WHITE }}
              >
                Create this post →
              </button>
            )}
          </div>
        </div>

        {/* MAIN GRID: controls + preview */}
        <div className="grid lg:grid-cols-[2fr_3fr] gap-8 items-start">
          {/* LEFT: CONTROLS */}
          <div className={mobileStep === 3 ? "hidden lg:grid lg:gap-6" : "grid gap-6"}>
          <div className={`${mobileStep === 1 ? "grid gap-6" : "hidden"} lg:contents`}>
            <section>
              <h3 className="font-body text-sm font-semibold mb-2.5" style={{ color: UI.ink }}>1. What are you posting about?</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORIES).map(([key, c]) => (
                  <button key={key} onClick={() => selectCategory(key)}
                    className="text-left p-3 rounded-lg border transition font-body text-xs"
                    style={{ borderColor: category === key ? ACCENT : UI.line, background: category === key ? UI.card : "transparent" }}>
                    <span className="font-semibold flex items-center gap-1.5" style={{ color: UI.ink }}>
                      <span>{c.icon}</span> {c.label}
                    </span>
                    <span className="block mt-0.5" style={{ color: UI.inkSoft }}>{c.description}</span>
                  </button>
                ))}
              </div>

              {!CATEGORIES[category].isTestimonial && CATEGORIES[category].options.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {CATEGORIES[category].options.map((key) => (
                    <button key={key} onClick={() => applyTemplate(key)}
                      className="py-1.5 px-3 rounded-full border font-body text-xs font-semibold transition"
                      style={{ borderColor: form.template === key ? ACCENT : UI.line, background: form.template === key ? UI.card : "transparent", color: UI.ink }}>
                      {TEMPLATES[key].label}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="font-body text-sm font-semibold mb-2.5" style={{ color: UI.ink }}>2. Add the details</h3>
              <div className="grid gap-3">
                {form.style !== "testimonial" && form.style !== "poll" && (
                  <>
                    <UploadBox label="PHOTO" icon={ImageIcon} state={photo} hint="Drop or click to add a photo" />
                    <PhotoReposition state={photo} aspect={form.aspect} />
                  </>
                )}

                {form.style === "card" && (
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>{activeTemplate.subjectLabel}</span>
                    <input className="input" value={form.subject} onChange={update("subject")} placeholder={activeTemplate.subjectPlaceholder} />
                  </label>
                )}

                {form.style === "card" && (
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE</span>
                    <input className="input" value={`${form.word1} ${form.script}`.trim()}
                      onChange={(e) => {
                        const { lead, emphasis } = splitHeadlineLastWord(e.target.value);
                        setForm((f) => ({ ...f, word1: lead, script: emphasis }));
                      }} placeholder="Local Favorite!" />
                    <span className="font-body text-xs block mt-1" style={{ color: UI.inkSoft }}>The last word gets your accent color and script font.</span>
                  </label>
                )}

                {form.style === "card" && (
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>{activeTemplate.bodyLabel}</span>
                    <textarea className="input" rows={3} value={form.body} onChange={update("body")} placeholder={activeTemplate.bodyPlaceholder} />
                  </label>
                )}

                {(form.style === "tips" || form.style === "stats" || form.style === "checklist") && (
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>
                      {form.style === "tips" ? "TITLE" : "HEADLINE"}
                    </span>
                    <input className="input" value={form.subject} onChange={update("subject")} placeholder="Summer Open House Tips" />
                  </label>
                )}

                {form.style === "stats" && (
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BIG NUMBER</span>
                    <input className="input" value={form.bigNumber} onChange={update("bigNumber")} placeholder="5" />
                  </label>
                )}

                {(form.style === "tips" || form.style === "stats" || form.style === "checklist") && (
                  <label className="block">
                    <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>
                      LIST ITEMS (one per line)
                    </span>
                    <textarea className="input" rows={4} value={form.listItems} onChange={update("listItems")} placeholder={"Turn on the AC\nOffer cold refreshments\nHighlight outdoor spaces"} />
                  </label>
                )}

                {form.style === "quote" && (
                  <>
                    <label className="block">
                      <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>EYEBROW LABEL (optional)</span>
                      <input className="input" value={form.quoteEyebrow} onChange={update("quoteEyebrow")} placeholder="Design Tip" />
                    </label>
                    <label className="block">
                      <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>YOUR MESSAGE</span>
                      <textarea className="input" rows={4} value={form.quoteText} onChange={update("quoteText")} placeholder="A fresh coat of paint is still the highest-ROI update you can make before listing." />
                    </label>
                  </>
                )}

                {form.style === "poll" && (
                  <>
                    <label className="block">
                      <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>HEADLINE</span>
                      <input className="input" value={form.pollHeadline} onChange={update("pollHeadline")} placeholder="Which Kitchen Style Do You Love?" />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OPTION A</span>
                        <input className="input" value={form.optionA} onChange={update("optionA")} placeholder="Open Concept" />
                      </label>
                      <label className="block">
                        <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>OPTION B</span>
                        <input className="input" value={form.optionB} onChange={update("optionB")} placeholder="Defined Rooms" />
                      </label>
                    </div>
                  </>
                )}

                {form.style === "testimonial" && (
                  <>
                    <label className="block">
                      <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PASTE YOUR CLIENT'S REVIEW</span>
                      <textarea className="input" rows={4} value={form.quote} onChange={update("quote")} placeholder="Mariella was a joy to work with..." />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>CLIENT NAME</span>
                        <input className="input" value={form.clientName} onChange={update("clientName")} placeholder="Mariella Torres" />
                      </label>
                      <label className="block">
                        <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>BUYER OR SELLER</span>
                        <select className="input" value={form.clientType} onChange={update("clientType")}>
                          <option value="Buyer">Buyer</option>
                          <option value="Seller">Seller</option>
                        </select>
                      </label>
                    </div>
                    <UploadBox label="CLIENT / PROPERTY PHOTO (optional)" icon={ImageIcon} state={photo} hint="Drop or click to add a photo" />
                    <PhotoReposition state={photo} aspect={form.aspect} />
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{ borderColor: UI.line }}>
                      <input type="checkbox" checked={form.useHeadshot} onChange={(e) => setForm((f) => ({ ...f, useHeadshot: e.target.checked }))} className="hidden" />
                      <span className="flex-1 font-body text-xs font-semibold" style={{ color: UI.ink }}>
                        Show a photo in the circle
                        <span className="block font-normal mt-0.5" style={{ color: UI.inkSoft }}>Uses the photo above, or your headshot if none is added.</span>
                      </span>
                      <span className="flex-shrink-0 rounded-full transition" style={{ width: 34, height: 20, background: form.useHeadshot ? ACCENT : UI.line, position: "relative" }}>
                        <span className="absolute rounded-full transition" style={{ width: 14, height: 14, top: 3, left: form.useHeadshot ? 17 : 3, background: WHITE }} />
                      </span>
                    </label>
                    <div className="block">
                      <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>RATING</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))}
                            aria-label={`${n} star${n === 1 ? "" : "s"}`}
                            style={{ color: n <= form.rating ? form.accentColor : UI.line, fontSize: "1.4rem", lineHeight: 1 }}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
            {form.style !== "testimonial" && (
              <section>
                <h3 className="font-body text-sm font-semibold mb-2.5" style={{ color: UI.ink }}>3. Choose your look</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STYLES).filter(([key]) => key !== "testimonial").map(([key, s]) => (
                    <button key={key} onClick={() => setForm((f) => ({ ...f, style: key }))}
                      className="relative text-left rounded-lg border overflow-hidden transition"
                      style={{ borderColor: form.style === key ? ACCENT : UI.line, borderWidth: form.style === key ? 2 : 1, boxShadow: form.style === key ? `0 0 0 2px ${ACCENT}22` : "none" }}>
                      {form.style === key && (
                        <span className="absolute flex items-center justify-center rounded-full" style={{ top: 6, right: 6, width: 18, height: 18, background: ACCENT, zIndex: 1 }}>
                          <Check size={11} color={WHITE} strokeWidth={3} />
                        </span>
                      )}
                      <canvas
                        ref={(el) => { styleThumbRefs.current[key] = el; }}
                        style={{ display: "block", width: "100%", height: "auto" }}
                      />
                      <span className="font-body font-semibold block px-2 py-1.5" style={{ color: UI.ink, background: UI.card, fontSize: "0.68rem" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

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
                <Accordion title="Customize design" subtitle="Accent color, personal note, size, contact band" defaultOpen>
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
              <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SCRIPT FONT</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SCRIPT_FONTS.map((f) => (
                  <button key={f.name} onClick={() => setForm((prev) => ({ ...prev, scriptFont: f.name }))}
                    className="text-left p-2.5 rounded border transition"
                    style={{ borderColor: form.scriptFont === f.name ? ACCENT : UI.line, background: form.scriptFont === f.name ? UI.card : "transparent" }}>
                    <span style={{ fontFamily: `"${f.name}", cursive`, fontWeight: f.weight, fontSize: "1.15rem", color: UI.ink, lineHeight: 1.2, display: "block" }}>
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {form.style === "card" && (
              <label className="block md:col-span-2">
                <span className="font-mono text-xs block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>PERSONAL NOTE</span>
                <textarea className="input" rows={3} value={form.badgeText} onChange={update("badgeText")} />
              </label>
            )}

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

            {form.style === "card" && (
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
            )}
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
            </div>

            {/* CONSOLIDATED DOWNLOAD CARD — everything needed to finish and post lives here, next to the preview it belongs with */}
            <div className="rounded-2xl border p-3.5 sm:p-6 mt-3 sm:mt-4" style={{ background: UI.card, borderColor: UI.line }}>
              <h3 className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Your social set is ready</h3>
              <p className="font-body text-xs mt-1 mb-3 sm:mb-4" style={{ color: UI.inkSoft }}>
                {wantSocialSet ? "Download this size, or every platform size at once." : "Turn on “Create My Social Set” to get every platform size at once."}
              </p>

              <div className="grid gap-2">
                <button
                  onClick={downloadImage}
                  disabled={downloading}
                  className="w-full py-3 rounded-lg font-body font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: ACCENT, color: WHITE }}
                >
                  <Download size={16} /> {downloading ? "Preparing…" : `Download current design (${ASPECTS[form.aspect].label})`}
                </button>
                {wantSocialSet && (
                  <button
                    onClick={downloadAllSizes}
                    disabled={downloadingAll}
                    className="w-full py-3 rounded-lg border font-body font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                    style={{ borderColor: UI.line, color: UI.ink }}
                  >
                    <Download size={16} /> {downloadingAll ? "Preparing…" : "Download all sizes"}
                  </button>
                )}
                <button
                  onClick={copyCaption}
                  className="w-full py-3 rounded-lg border font-body font-semibold text-sm flex items-center justify-center gap-2 transition"
                  style={{ borderColor: UI.line, color: UI.ink }}
                >
                  {captionCopied ? <Check size={16} /> : <Copy size={16} />} {captionCopied ? "Caption copied!" : "Copy caption"}
                </button>
              </div>

              {downloadError && (
                <p className="font-body text-xs mt-3" style={{ color: ERROR }}>{downloadError}</p>
              )}

              <div className="rounded-lg p-3 mt-4" style={{ background: UI.stone }}>
                <span className="font-mono text-xs font-semibold block mb-1.5" style={{ color: UI.inkSoft, letterSpacing: "0.04em" }}>SUGGESTED CAPTION</span>
                <p className="font-body text-xs whitespace-pre-line" style={{ color: UI.ink, lineHeight: 1.6 }}>{buildCaption()}</p>
              </div>

              <div className="mt-4">
                <PrivacyBadge />
              </div>
            </div>

            {wantSocialSet && (
              <div className={mobileStep === 3 ? "mt-4" : "hidden lg:block mt-4"}>
                <span className="font-body text-xs font-semibold block mb-2" style={{ color: UI.inkSoft }}>Included in your social set</span>
                <div className="grid grid-cols-3 gap-2">
                  {THUMB_ASPECTS.map((key) => (
                    <div key={key}>
                      <div className="rounded-lg border overflow-hidden flex items-center justify-center p-1.5" style={{ background: UI.card, borderColor: UI.line }}>
                        <canvas
                          ref={(el) => { setThumbRefs.current[key] = el; }}
                          style={{ display: "block", width: "100%", height: "auto", borderRadius: "3px" }}
                        />
                      </div>
                      <p className="font-body text-xs font-semibold mt-1.5" style={{ color: UI.ink }}>{ASPECTS[key].label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
