import { useOutletContext } from "react-router-dom";
import { TerraformModulesPage } from "../components/TerraformModulesPage";
import type { ProjectRouteContext } from "./ArchitectureDetailPage";

export function ProjectTerraformPage() {
  const { architecture } = useOutletContext<ProjectRouteContext>();

  return <TerraformModulesPage architecture={architecture} />;
}

