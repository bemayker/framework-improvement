import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers loading, failure and an unusable body alike: the footer then
  // shows the app name alone, never a placeholder.
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
        // Intentionally silent: a failed lookup leaves the name-only footer.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = backendVersion?.version ?? null;
  // The commit only appears next to a version, never on its own.
  const commit = version === null ? null : (backendVersion?.commit ?? null);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <span data-testid="app-footer-version"> v{version}</span>
      )}
      {commit !== null && (
        <span data-testid="app-footer-commit"> ({commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
