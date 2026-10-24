import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The footer shows 7 characters of the commit; the backend sends 12.
const SHORT_COMMIT_LENGTH = 7;

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
      .then((result) => {
        if (isMounted) {
          setBackendVersion(result);
        }
      })
      .catch(() => {
        // The footer is informational: a failed version load leaves the app
        // name alone and must not affect the rest of the page.
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
          <span data-testid="app-footer-version">v{backendVersion.version}</span>
          {backendVersion.commit !== null && (
            <>
              {" "}
              <span data-testid="app-footer-commit">
                ({backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})
              </span>
            </>
          )}
        </>
      )}
    </footer>
  );
}

export default AppFooter;
