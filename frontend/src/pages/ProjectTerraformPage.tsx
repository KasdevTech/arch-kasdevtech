import { TerraformModulesPage } from "../components/TerraformModulesPage";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

interface ProjectTerraformPageProps {
  architecture?: ProjectRouteContext["architecture"];
}

export function ProjectTerraformPage(props: ProjectTerraformPageProps = {}) {
  if (!props.architecture) {
    return null;
  }
  const architecture = props.architecture;
  return <TerraformModulesPage architecture={architecture} />;
}
