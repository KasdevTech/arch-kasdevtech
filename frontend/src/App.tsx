import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ArchitectChatWidget } from "./components/ArchitectChatWidget";
import { ArchitectureDetailPage } from "./pages/ArchitectureDetailPage";
import { ChatPage } from "./pages/ChatPage";
import { LandingPage } from "./pages/LandingPage";
import { ProjectArchitecturePage } from "./pages/ProjectArchitecturePage";
import { ProjectOverviewPage } from "./pages/ProjectOverviewPage";
import { ProjectTerraformPage } from "./pages/ProjectTerraformPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { StudioPage } from "./pages/StudioPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/studio" replace />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="projects/:projectId/edit" element={<StudioPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ArchitectureDetailPage />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ProjectOverviewPage />} />
            <Route path="architecture" element={<ProjectArchitecturePage />} />
            <Route path="code" element={<ProjectTerraformPage />} />
            <Route
              path="terraform"
              element={<Navigate to="../code" replace />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ArchitectChatWidget />
    </>
  );
}

export default App;
