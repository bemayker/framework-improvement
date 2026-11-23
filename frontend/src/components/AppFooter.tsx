import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend's own sentinel for "package metadata not installed"
// (version_service.UNKNOWN_VERSION); it is not a version worth showing.
const UNKNOWN_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers both the pending and the failed request: the footer then
  // shows the name alone rather than a placeholder or an empty gap.
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((backendVersion) => {
        if (isMounted && backendVersion !== UNKNOWN_VERSION) {
          setVersion(backendVersion);
        }
      })
      .catch(() => {
        // Intentionally unresolved: the name-only footer is the failure state.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <span data-testid="app-footer-version">{` v${version}`}</span>
      )}
    </footer>
  );
}

export default AppFooter;
