import { useEffect, useState, type CSSProperties } from "react";
import { getBackendVersionInfo, type BackendVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [info, setInfo] = useState<BackendVersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersionInfo()
      .then((backendInfo) => {
        if (isMounted) {
          setInfo(backendInfo);
        }
      })
      .catch(() => {
        // Loading and failure render alike: the app name alone, never a placeholder.
        if (isMounted) {
          setInfo(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = info?.version ?? null;
  // The commit sits "next to the version", so it is never shown without one.
  const commit = version ? (info?.commit ?? null) : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version ? <span data-testid="app-version"> v{version}</span> : null}
      {commit ? <span data-testid="app-commit"> ({commit})</span> : null}
    </footer>
  );
}

export default AppFooter;
