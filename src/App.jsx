import { useState } from "react";
import { GlobalStyles } from "./shared.jsx";
import { ListingTool } from "./ListingTool.jsx";
import { CommunityTool } from "./CommunityTool.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { AuthScreen } from "./auth/AuthScreen.jsx";

function AppShell() {
  const [activeTool, setActiveTool] = useState("listings");
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <AuthScreen />;

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
