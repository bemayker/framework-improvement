import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backend, setBackend] = useState<BackendVersion | null>(null);
  const version = backend?.version ?? null;
  const commit = backend?.commit ?? null;

  useEffect(() => {
    let isMounted = true;

    // Pending and failed both leave the backend info unset: the footer then
    // shows only the app name, never a placeholder. The commit is never shown
    // without a version, since it is displayed next to it.
    getBackendVersion()
      .then((backendVersion) => {
        if (isMounted) {
          setBackend(backendVersion);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && <span data-testid="app-version"> v{version}</span>}
      {version !== null && commit !== null && (
        <span data-testid="app-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>
      )}
    </footer>
  );
}

export default AppFooter;
