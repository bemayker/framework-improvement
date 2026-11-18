import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getVersion, UNKNOWN_BACKEND_VERSION } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

// While loading, on failure and on the backend's "unknown" answer the footer
// shows the app name alone: it stays a non-empty landmark and shows no
// version-shaped placeholder.
function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((resolved) => {
        if (isMounted && resolved !== UNKNOWN_BACKEND_VERSION) {
          setVersion(resolved);
        }
      })
      .catch(() => {
        // Unresolved version is a supported state, not an error to surface.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version && <span data-testid="app-version"> v{version}</span>}
    </footer>
  );
}

export default AppFooter;
