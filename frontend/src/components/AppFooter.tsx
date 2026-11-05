import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendBuildInfo } from "../api/version";
import type { BackendBuildInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function formatFooterText({ version, commit }: BackendBuildInfo): string {
  const nameAndVersion = `${APP_NAME} v${version}`;
  return commit === null ? nameAndVersion : `${nameAndVersion} (${commit})`;
}

function AppFooter() {
  // null covers loading, failure and "backend reported no version": all render
  // the app name alone, never a placeholder.
  const [buildInfo, setBuildInfo] = useState<BackendBuildInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendBuildInfo()
      .then((backendBuildInfo) => {
        if (isMounted) {
          setBuildInfo(backendBuildInfo);
        }
      })
      .catch(() => {
        // Unreachable backend: the footer keeps showing the app name only.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {buildInfo === null ? APP_NAME : formatFooterText(buildInfo)}
    </footer>
  );
}

export default AppFooter;
