import { useState } from "react";
import { GlobalStyles } from "./shared.jsx";
import { ListingTool } from "./ListingTool.jsx";
import { CommunityTool } from "./CommunityTool.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { AuthScreen } from "./auth/AuthScreen.jsx";
import { ResetPasswordScreen } from "./auth/ResetPasswordScreen.jsx";
import { OnboardingWizard } from "./onboarding/OnboardingWizard.jsx";

function getResetParams() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("resetToken");
  const email = params.get("resetEmail");
  return token && email ? { token, email } : null;
}

function AppShell() {
  const [activeTool, setActiveTool] = useState("listings");
  const [resetParams, setResetParams] = useState(getResetParams);
  const { user, brandKit, loading } = useAuth();

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

  if (loading) return null;
  if (!user) return <AuthScreen />;
  if (brandKit && !brandKit.onboarded) return <OnboardingWizard />;

  return activeTool === "listings" ? (
    <ListingTool onSwitchTool={setActiveTool} />
  ) : (
    <CommunityTool onSwitchTool={setActiveTool} />
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
