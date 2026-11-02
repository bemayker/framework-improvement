import { useEffect, useState, type CSSProperties } from "react";
import { getBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend's own sentinel for "distribution metadata missing".
const UNRESOLVED_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((backendVersion) => {
        if (isMounted && backendVersion && backendVersion !== UNRESOLVED_VERSION) {
          setVersion(backendVersion);
        }
      })
      .catch(() => {
        // Loading and failure render the same app-name-only footer, so a
        // failed request needs no state of its own.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <span data-testid="app-footer-version"> v{version}</span>
      )}
    </footer>
  );
}

export default AppFooter;
