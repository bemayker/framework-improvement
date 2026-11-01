import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendBuild } from "../api/version";
import type { BackendBuild } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers loading, failure and an unresolved version alike: the footer
  // then reads exactly the app name, never a placeholder or "unknown". A
  // resolved build with a null commit shows the version alone.
  const [build, setBuild] = useState<BackendBuild | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendBuild()
      .then((backendBuild) => {
        if (isMounted) {
          setBuild(backendBuild);
        }
      })
      .catch(() => {
        // Intentionally silent: a failed lookup leaves the footer without a version.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {build !== null && <span data-testid="app-version"> v{build.version}</span>}
      {build?.commit != null && (
        <span data-testid="app-commit"> ({build.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
