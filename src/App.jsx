import { useState } from "react";
import { Key } from "lucide-react";
import { GlobalStyles } from "./shared.jsx";
import { ListingTool } from "./ListingTool.jsx";
import { CommunityTool } from "./CommunityTool.jsx";
import { CalendarTool } from "./CalendarTool.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { AuthScreen } from "./auth/AuthScreen.jsx";
import { ResetPasswordScreen } from "./auth/ResetPasswordScreen.jsx";
import { OnboardingWizard } from "./onboarding/OnboardingWizard.jsx";
import { AUTH } from "./auth/AuthShell.jsx";
import { HomePage } from "./marketing/HomePage.jsx";
import { AboutPage } from "./marketing/AboutPage.jsx";

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

function AppShell() {
  const [activeTool, setActiveTool] = useState("listings");
  const [resetParams, setResetParams] = useState(getResetParams);
  const [authView, setAuthView] = useState(null); // null (homepage) | "login" | "signup"
  const [showHome, setShowHome] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const { user, brandKit, loading } = useAuth();

  // Shared by every entry point (logged-out homepage, standalone "go home"
  // link, the About page itself) so "Get Started"/"Log in" always resolve
  // the same way regardless of which screen they were clicked from.
  const goGetStarted = () => { setShowAbout(false); setShowHome(false); if (!user) setAuthView("signup"); };
  const goLogIn = () => { setShowAbout(false); setShowHome(false); if (!user) setAuthView("login"); };

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

  if (showAbout) {
    return <AboutPage onBack={() => setShowAbout(false)} onGetStarted={goGetStarted} onLogIn={goLogIn} />;
  }

  if (!user) {
    if (!authView) {
      return <HomePage onGetStarted={goGetStarted} onLogIn={goLogIn} onAbout={() => setShowAbout(true)} />;
    }
    return <AuthScreen initialMode={authView} onBack={() => setAuthView(null)} />;
  }

  if (showHome) {
    return <HomePage onGetStarted={goGetStarted} onLogIn={goLogIn} onAbout={() => setShowAbout(true)} />;
  }

  if (brandKit && !brandKit.onboarded) return <OnboardingWizard />;

  if (activeTool === "listings") return <ListingTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  if (activeTool === "calendar") return <CalendarTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
  return <CommunityTool onSwitchTool={setActiveTool} onGoHome={() => setShowHome(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <AppShell />
    </AuthProvider>
  );
}
