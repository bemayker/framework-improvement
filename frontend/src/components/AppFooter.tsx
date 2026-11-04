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

    // Loading and failure both leave the state null: the footer then reads
    // just the app name. The commit shows only next to a version.
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBackendVersion(resolved);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const version = backendVersion?.version ?? null;
  const commit = backendVersion?.commit ?? null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && <span data-testid="app-version"> v{version}</span>}
      {version !== null && commit !== null && (
        <span data-testid="app-commit"> ({commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
