import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // Stays null while the request is pending and when it fails, so the footer
  // then reads the app name alone.
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((backendVersion) => {
        if (isMounted) {
          setVersion(backendVersion);
        }
      })
      .catch(() => {
        // An unresolved version is a supported state, not an error to surface.
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
