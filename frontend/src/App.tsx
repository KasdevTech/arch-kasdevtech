import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ArchitectChatWidget } from "./components/ArchitectChatWidget";
import { ArchitectureDetailPage } from "./pages/ArchitectureDetailPage";
import { BlogPage } from "./pages/BlogPage";
import { ChatPage } from "./pages/ChatPage";
import { ContactPage } from "./pages/ContactPage";
import { DocsPage } from "./pages/DocsPage";
import { LandingPage } from "./pages/LandingPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { StudioPage } from "./pages/StudioPage";

function App() {
  const location = useLocation();

  return (
    <>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/studio" replace />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="projects/:projectId/edit" element={<StudioPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route
            path="projects/:projectId"
            element={<Navigate to="arch" replace />}
          />
          <Route path="projects/:projectId/arch" element={<ArchitectureDetailPage />} />
          <Route path="projects/:projectId/code" element={<ArchitectureDetailPage />} />
          <Route path="projects/:projectId/ship" element={<ArchitectureDetailPage />} />
          <Route
            path="projects/:projectId/architecture"
            element={<Navigate to="../arch" replace />}
          />
          <Route
            path="projects/:projectId/overview"
            element={<Navigate to="../arch" replace />}
          />
          <Route
            path="projects/:projectId/terraform"
            element={<Navigate to="../code" replace />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ArchitectChatWidget />
    </>
  );
}

export default App;
