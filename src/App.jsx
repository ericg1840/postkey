import { useState } from "react";
import { GlobalStyles } from "./shared.jsx";
import { ListingTool } from "./ListingTool.jsx";
import { CommunityTool } from "./CommunityTool.jsx";

export default function App() {
  const [activeTool, setActiveTool] = useState("listings");
  return (
    <>
      <GlobalStyles />
      {activeTool === "listings" ? (
        <ListingTool onSwitchTool={setActiveTool} />
      ) : (
        <CommunityTool onSwitchTool={setActiveTool} />
      )}
    </>
  );
}
