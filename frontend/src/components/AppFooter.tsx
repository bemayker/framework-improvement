import { useEffect, useState, type CSSProperties } from "react";
import { getBackendVersion, type BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";
const COMMIT_DISPLAY_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((loaded) => {
        if (isMounted) {
          setBackendVersion(loaded);
        }
      })
      .catch(() => {
        // An unresolved version leaves the footer at the app name alone.
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
