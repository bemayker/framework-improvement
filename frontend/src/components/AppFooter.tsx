import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendBuild } from "../api/version";
import type { BackendBuild } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backendBuild, setBackendBuild] = useState<BackendBuild | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendBuild().then((resolved) => {
      if (isMounted) {
        setBackendBuild(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backendBuild !== null && (
        <span data-testid="app-footer-version"> v{backendBuild.version}</span>
      )}
      {backendBuild?.commit != null && (
        <span data-testid="app-footer-commit"> ({backendBuild.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
