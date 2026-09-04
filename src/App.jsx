import { useState, useEffect } from "react";
import { Key } from "lucide-react";
import { GlobalStyles } from "./shared.jsx";
import { ListingTool } from "./ListingTool.jsx";
import { CommunityTool } from "./CommunityTool.jsx";
import { CalendarTool } from "./CalendarTool.jsx";
import { DescriptionTool } from "./DescriptionTool.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { AuthScreen } from "./auth/AuthScreen.jsx";
import { ResetPasswordScreen } from "./auth/ResetPasswordScreen.jsx";
import { OnboardingWizard } from "./onboarding/OnboardingWizard.jsx";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist.jsx";
import { ProfilePage } from "./profile/ProfilePage.jsx";
import { HelpPage } from "./HelpPage.jsx";
import { BioEditorPage } from "./profile/BioEditorPage.jsx";
import { PublicBioPage } from "./profile/PublicBioPage.jsx";
import { AUTH } from "./auth/AuthShell.jsx";
import { AdminDashboard } from "./admin/AdminDashboard.jsx";
import { HomePage } from "./marketing/HomePage.jsx";
import { AboutPage } from "./marketing/AboutPage.jsx";
import { LegalPage } from "./marketing/LegalPage.jsx";

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(180deg, #BFE0F5 0%, #DCEEFA 45%, #F3F9FD 100%)" }}
    >
      <style>{`
        @keyframes postkey-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 48, height: 48, background: AUTH.ink, animation: "postkey-spin 1.1s linear infinite" }}
        >
          <Key size={22} color="#FFFFFF" style={{ transform: "rotate(-45deg)" }} />
        </div>
      </div>
    </div>
  );
}

function getResetParams() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("resetToken");
  const email = params.get("resetEmail");
  return token && email ? { token, email } : null;
}

function getBioHandle() {
  const m = window.location.pathname.match(/^\/u\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function isAdminPath() {
  return window.location.pathname.replace(/\/+$/, "") === "/admin";
}

function AppShell() {
  const [activeTool, setActiveTool] = useState("listings");
  const [resetParams, setResetParams] = useState(getResetParams);
  const [bioHandle] = useState(getBioHandle);
  const [authView, setAuthView] = useState(null); // null (homepage) | "login" | "signup"
  const [showHome, setShowHome] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [legalView, setLegalView] = useState(null); // null | "privacy" | "terms"
  const [adminRoute, setAdminRoute] = useState(isAdminPath);
  const { user, brandKit, loading } = useAuth();

  // A non-admin (or logged-out) visitor never sees the admin panel — once
  // we know who's signed in, silently bounce them off the URL instead of
  // rendering anything admin-shaped.
  useEffect(() => {
    if (!adminRoute || loading) return;
    if (!user?.isAdmin) {
      window.history.replaceState({}, "", "/");
      setAdminRoute(false);
    }
  }, [adminRoute, loading, user]);

  const exitAdmin = () => {
    window.history.replaceState({}, "", "/");
    setAdminRoute(false);
  };

  // Shared by every entry point (logged-out homepage, standalone "go home"
  // link, the About page itself) so "Get Started"/"Log in" always resolve
  // the same way regardless of which screen they were clicked from.
  const goGetStarted = () => { setShowAbout(false); setShowHome(false); setLegalView(null); if (!user) setAuthView("signup"); };
  const goLogIn = () => { setShowAbout(false); setShowHome(false); setLegalView(null); if (!user) setAuthView("login"); };

  // Public link-in-bio page — no auth, no app chrome, renders before every
  // other gate (including the auth-loading screen) since it doesn't depend
  // on whether anyone is logged in on this browser.
  if (bioHandle) {
    return <PublicBioPage handle={bioHandle} />;
  }

  if (resetParams) {
    return (
      <ResetPasswordScreen
        email={resetParams.email}
        token={resetParams.token}
        onDone={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setResetParams(null);
        }}
      />
    );
  }

  if (loading) return <LoadingScreen />;

  if (adminRoute && user?.isAdmin) {
    return <AdminDashboard onExit={exitAdmin} />;
  }

  if (showAbout) {
    return <AboutPage onBack={() => setShowAbout(false)} onGetStarted={goGetStarted} onLogIn={goLogIn} />;
  }

  if (legalView) {
    return <LegalPage variant={legalView} onBack={() => setLegalView(null)} />;
  }

  if (!user) {
    if (!authView) {
      return (
        <HomePage
          onGetStarted={goGetStarted}
          onLogIn={goLogIn}
          onAbout={() => setShowAbout(true)}
          onPrivacy={() => setLegalView("privacy")}
          onTerms={() => setLegalView("terms")}
        />
      );
    }
    return <AuthScreen initialMode={authView} onBack={() => setAuthView(null)} />;
  }

  if (showHome) {
    return (
      <HomePage
        onGetStarted={goGetStarted}
        onLogIn={goLogIn}
        onAbout={() => setShowAbout(true)}
        onPrivacy={() => setLegalView("privacy")}
        onTerms={() => setLegalView("terms")}
      />
    );
  }

  if (brandKit && !brandKit.onboarded) return <OnboardingWizard />;

  let toolScreen;
  if (activeTool === "profile") toolScreen = <ProfilePage onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  else if (activeTool === "help") toolScreen = <HelpPage onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  else if (activeTool === "bio") toolScreen = <BioEditorPage onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  else if (activeTool === "listings") toolScreen = <ListingTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  else if (activeTool === "calendar") toolScreen = <CalendarTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  else if (activeTool === "description") toolScreen = <DescriptionTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  else toolScreen = <CommunityTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;

  return (
    <>
      {toolScreen}
      <OnboardingChecklist onNavigate={setActiveTool} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <AppShell />
    </AuthProvider>
  );
}
