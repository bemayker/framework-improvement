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
  const [backend, setBackend] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    // While pending, and on any failure, the footer shows the app name alone.
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBackend(resolved);
      })
      .catch(() => {
        if (isMounted) setBackend(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backend !== null && (
        <span data-testid="app-version"> v{backend.version}</span>
      )}
      {backend !== null && backend.commit !== null && (
        <span data-testid="app-commit"> ({backend.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
