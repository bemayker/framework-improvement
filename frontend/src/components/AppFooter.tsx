import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendVersion().then((resolved) => {
      if (isMounted) {
        setBackendVersion(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backendVersion !== null && (
        <span data-testid="app-version"> v{backendVersion.version}</span>
      )}
      {backendVersion?.commit != null && (
        <span data-testid="app-commit"> ({backendVersion.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
