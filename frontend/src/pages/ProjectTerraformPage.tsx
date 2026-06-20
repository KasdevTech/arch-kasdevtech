import { useOutletContext } from "react-router-dom";
import { TerraformModulesPage } from "../components/TerraformModulesPage";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

interface ProjectTerraformPageProps {
  architecture?: ProjectRouteContext["architecture"];
}

export function ProjectTerraformPage(props: ProjectTerraformPageProps = {}) {
  const routeContext = useOutletContext<ProjectRouteContext | undefined>();
  const architecture = props.architecture ?? routeContext?.architecture;
  if (!architecture) {
    return null;
  }
  return <TerraformModulesPage architecture={architecture} />;
}
