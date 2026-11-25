import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backend, setBackend] = useState<BackendVersion | null>(null);

  useEffect(() => {
    // Guards against setting state after unmount.
    let isMounted = true;

    fetchBackendVersion()
      .then((backendVersion) => {
        if (isMounted) {
          setBackend(backendVersion);
        }
      })
      .catch(() => {
        // Pending and failed both render the name only: a missing version is
        // the honest signal that the API did not answer.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backend !== null && (
        <span data-testid="app-version"> v{backend.version}</span>
      )}
      {backend?.commit != null && (
        // A sibling of app-version, so that span's text stays exactly v{version}.
        <span data-testid="app-commit">
          {` (${backend.commit.slice(0, SHORT_COMMIT_LENGTH)})`}
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
