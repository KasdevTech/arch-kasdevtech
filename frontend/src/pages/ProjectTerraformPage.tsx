import { useOutletContext } from "react-router-dom";
import { TerraformModulesPage } from "../components/TerraformModulesPage";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

interface ProjectTerraformPageProps {
  architecture?: ProjectRouteContext["architecture"];
}

export function ProjectTerraformPage(props: ProjectTerraformPageProps = {}) {
  const outletContext = useOutletContext<ProjectRouteContext>();
  const architecture = props.architecture ?? outletContext?.architecture;
  if (!architecture) {
    return null;
  }
  return <TerraformModulesPage architecture={architecture} />;
}
