import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend serves 12 characters; the footer shows the conventional short sha.
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // Loading and failure both stay null: the footer then shows the app name alone.
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) {
          setBackendVersion(resolved);
        }
      })
      .catch(() => {
        // An unreachable backend leaves the version unset; nothing to show.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backendVersion !== null && (
        <span data-testid="app-version"> v{backendVersion.version}</span>
      )}
      {backendVersion?.commit != null && (
        <span data-testid="app-commit">
          {" "}
          ({backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
