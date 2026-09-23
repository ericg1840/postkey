import { useEffect, useRef, useState } from "react";
import { QrCode, Download, X } from "lucide-react";
import { UI, WHITE } from "../shared.jsx";

// Print-ready QR code for the agent's public page — for yard signs, business
// cards, and open-house sign-in sheets. Dark on white with a full quiet zone,
// since print, glare and old phone cameras all punish anything fancier.
const SIZE = 1024;
const CAPTION_HEIGHT = 120;

async function drawQr(canvas, url) {
  // Loaded on demand: only the few agents who open this need it.
  const { default: qrcode } = await import("qrcode-generator");
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();

  const count = qr.getModuleCount();
  const quiet = 4;
  const cell = Math.floor(SIZE / (count + quiet * 2));
  const offset = Math.floor((SIZE - cell * count) / 2);

  canvas.width = SIZE;
  canvas.height = SIZE + CAPTION_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
    }
  }

  // The address printed underneath, for anyone who'd rather type it.
  ctx.fillStyle = "#1B2430";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 40px 'Public Sans', sans-serif";
  ctx.fillText(url.replace(/^https?:\/\//, ""), SIZE / 2, SIZE + CAPTION_HEIGHT / 2 - 20);
}

export function QrCodeButton({ url, handle }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    setError("");
    drawQr(canvasRef.current, url).catch(() => setError("Couldn't make the QR code. Try again."));
  }, [open, url]);

  const download = () => {
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `postkey-${handle}-qr.png`;
    a.click();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 border font-mono text-xs transition"
        style={{ borderColor: UI.line, color: UI.inkSoft, minHeight: 32 }}
      >
        <QrCode size={13} /> QR code
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(14,20,28,0.55)" }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="QR code for your Key Link page"
        >
          <div className="rounded-2xl p-5 w-full max-w-xs" style={{ background: WHITE }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-body text-sm font-semibold" style={{ color: UI.ink }}>Your page's QR code</h2>
                <p className="font-body text-xs mt-0.5" style={{ color: UI.inkSoft }}>Put it on signs, business cards and open-house sheets.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, color: UI.inkSoft }}>
                <X size={16} />
              </button>
            </div>
            <canvas ref={canvasRef} className="w-full h-auto rounded-lg border" style={{ borderColor: UI.line }} />
            {error && <p className="font-body text-xs mt-2" style={{ color: "#C0392B" }}>{error}</p>}
            <button
              onClick={download}
              disabled={!!error}
              className="press-fx w-full mt-4 font-body text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ minHeight: 44, background: UI.ink, color: WHITE }}
            >
              <Download size={14} /> Download PNG
            </button>
          </div>
        </div>
      )}
    </>
  );
}
