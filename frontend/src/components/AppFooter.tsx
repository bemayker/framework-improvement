import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersionInfo } from "../api/version";
import type { BackendVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // Null while loading and after a failure: both render the app name alone.
  const [info, setInfo] = useState<BackendVersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersionInfo()
      .then((backendInfo) => {
        if (isMounted) setInfo(backendInfo);
      })
      .catch(() => {
        // An unresolved version simply leaves the footer without one.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = info?.version;
  // The commit is only meaningful next to a version.
  const commit = version ? info?.commit : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version && (
        <>
          {" "}
          <span data-testid="app-version">v{version}</span>
        </>
      )}
      {commit && (
        <>
          {" ("}
          <span data-testid="app-commit">{commit}</span>
          {")"}
        </>
      )}
    </footer>
  );
}

export default AppFooter;
