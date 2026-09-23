// Turning what an agent typed into a link on their public page.

// tel:, sms: and mailto: pass through as-is so "Call me" / "Text me" /
// "Email me" links open the phone's dialer, messages or mail app — they used
// to get "https://" stuck on the front like any bare domain, which broke
// them. Any other scheme (javascript:, data:, ...) still gets "https://"
// prepended, which turns it into a harmless dead link rather than code.
const PASSTHROUGH_SCHEME = /^(https?:\/\/|tel:|sms:|mailto:)/i;

export function linkHref(link) {
  const url = String(link?.url || "").trim();
  if (!url) return "#";
  return PASSTHROUGH_SCHEME.test(url) ? url : `https://${url}`;
}

// Phone/text/email links stay in the current tab: target="_blank" on them
// just leaves an empty tab behind once the dialer or mail app opens.
export function linkProps(link) {
  const href = linkHref(link);
  return /^(tel|sms|mailto):/i.test(href) ? { href } : { href, target: "_blank", rel: "noreferrer" };
}
