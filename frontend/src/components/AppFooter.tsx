import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

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
      .then((resolved) => {
        if (isMounted) setBackendVersion(resolved);
      })
      .catch(() => {
        // The footer is informational: an unreachable backend shows the app
        // name alone, the same render as while the request is in flight.
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
        <>
          {" "}
          <span data-testid="app-version">v{backendVersion.version}</span>
          {backendVersion.commit !== null && (
            <>
              {" ("}
              <span data-testid="app-commit">
                {backendVersion.commit.slice(0, COMMIT_DISPLAY_LENGTH)}
              </span>
              {")"}
            </>
          )}
        </>
      )}
    </footer>
  );
}

export default AppFooter;
