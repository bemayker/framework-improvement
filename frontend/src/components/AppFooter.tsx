import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";
const COMMIT_DISPLAY_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers loading, failure and the backend's "unknown" version alike:
  // the footer then shows the app name alone.
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBackendVersion(resolved);
      })
      .catch(() => {
        if (isMounted) setBackendVersion(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backendVersion !== null && (
        <span data-testid="app-footer-version"> v{backendVersion.version}</span>
      )}
      {backendVersion?.commit != null && (
        <span data-testid="app-footer-commit">
          {` (${backendVersion.commit.slice(0, COMMIT_DISPLAY_LENGTH)})`}
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
