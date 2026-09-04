import { ArrowLeft } from "lucide-react";
import { AUTH } from "../auth/AuthShell.jsx";
import { ACCENT_PRESETS, Logo } from "../shared.jsx";

const PRIMARY = ACCENT_PRESETS[1];

function Section({ title, children }) {
  return (
    <div className="mt-8">
      <h2 className="font-display font-bold text-lg" style={{ color: AUTH.ink }}>{title}</h2>
      <div className="font-body text-sm mt-2 space-y-3" style={{ color: AUTH.muted, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

const EFFECTIVE_DATE = "August 31, 2026";

function PrivacyBody() {
  return (
    <>
      <Section title="What we collect">
        <p>
          When you create a PostKey account, we collect the information you give us directly — your name, email
          address, brokerage details, and the brand kit assets (logo, colors, fonts, headshot, and contact info)
          you upload to personalize your posts.
        </p>
        <p>
          Listing and client photos you use inside the design tools are processed on your device and are not
          uploaded to our servers unless you explicitly save or export a post.
        </p>
      </Section>
      <Section title="How we use it">
        <p>
          We use your information to operate your account, generate the posts and content you request, and
          communicate with you about your account (like password resets or product updates). We do not sell your
          personal information.
        </p>
      </Section>
      <Section title="Sharing">
        <p>
          We share data only with service providers who help us run PostKey (such as hosting and email delivery),
          and only to the extent needed to provide the service. We do not share your data with third parties for
          their own marketing purposes.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can update or delete your brand kit and account information at any time from your profile settings.
          To request deletion of your account and associated data, contact us at{" "}
          <a href="mailto:support@postkey.app" className="font-semibold" style={{ color: PRIMARY }}>support@postkey.app</a>.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Questions about this policy? Reach out at{" "}
          <a href="mailto:support@postkey.app" className="font-semibold" style={{ color: PRIMARY }}>support@postkey.app</a>.
        </p>
      </Section>
    </>
  );
}

function TermsBody() {
  return (
    <>
      <Section title="Using PostKey">
        <p>
          PostKey is a tool for creating on-brand social media content for real estate agents. By using PostKey,
          you agree to use it lawfully and not to upload content you don't have the rights to use, including
          listing photos, headshots, or client images.
        </p>
      </Section>
      <Section title="Your account">
        <p>
          You're responsible for keeping your login credentials secure and for the activity that happens under
          your account. Let us know right away if you suspect unauthorized access.
        </p>
      </Section>
      <Section title="Your content">
        <p>
          You retain ownership of the photos, brand assets, and posts you create with PostKey. You grant us the
          limited right to process and store that content solely to provide the service to you.
        </p>
      </Section>
      <Section title="Availability">
        <p>
          We aim to keep PostKey available and reliable, but the service is provided "as is" without warranties
          of any kind. We may update or change features from time to time.
        </p>
      </Section>
      <Section title="Changes to these terms">
        <p>
          We may update these terms occasionally. If we make material changes, we'll let you know by posting the
          updated terms with a new effective date.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Questions about these terms? Reach out at{" "}
          <a href="mailto:support@postkey.app" className="font-semibold" style={{ color: PRIMARY }}>support@postkey.app</a>.
        </p>
      </Section>
    </>
  );
}

export function LegalPage({ variant, onBack }) {
  const isPrivacy = variant === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";

  return (
    <div style={{ background: "#FDFBF7" }} className="min-h-dvh">
      <header style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-1">
          <button onClick={onBack} className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
            <Logo size={26} />
            <span className="font-display font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: AUTH.ink }}>PostKey</span>
          </button>
          <button onClick={onBack} className="flex items-center gap-1.5 font-body text-sm font-semibold" style={{ color: AUTH.muted }}>
            <ArrowLeft size={15} /> Back to home
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 pb-20">
        <h1 className="font-display font-bold" style={{ color: AUTH.ink, fontSize: "2rem" }}>{title}</h1>
        <p className="font-body text-xs mt-2" style={{ color: AUTH.muted }}>Effective {EFFECTIVE_DATE}</p>
        {isPrivacy ? <PrivacyBody /> : <TermsBody />}
      </main>

      <footer className="max-w-6xl mx-auto px-6 pt-10 pb-8 border-t" style={{ borderColor: AUTH.border }}>
        <button onClick={onBack} className="font-body text-xs font-semibold flex items-center gap-1.5" style={{ color: AUTH.muted }}>
          <ArrowLeft size={13} /> Back to home
        </button>
        <p className="font-body text-xs mt-6" style={{ color: AUTH.muted }}>© {new Date().getFullYear()} PostKey. All rights reserved.</p>
      </footer>
    </div>
  );
}
