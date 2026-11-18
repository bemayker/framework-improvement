import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers pending, failed and unknown alike: the footer then shows only
  // the app name, so it is never blank and never prints a misleading value.
  // The commit arrives with the version and is shown only beside a version.
  const [backend, setBackend] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((resolved) => {
        if (isMounted) setBackend(resolved);
      })
      .catch(() => {
        // Leave the version unresolved; the footer renders without it.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backend ? (
        <span data-testid="app-version"> v{backend.version}</span>
      ) : null}
      {backend?.commit ? (
        <span data-testid="app-commit"> ({backend.commit})</span>
      ) : null}
    </footer>
  );
}

export default AppFooter;
