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
  // null covers loading and failure alike: both render the name alone.
  const [backend, setBackend] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBackend(resolved);
      })
      .catch(() => {
        if (isMounted) setBackend(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = backend?.version ?? null;
  const commit = backend?.commit ?? null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <span data-testid="app-footer-version"> v{version}</span>
      )}
      {version !== null && commit !== null && (
        <span data-testid="app-footer-commit">
          {` (${commit.slice(0, SHORT_COMMIT_LENGTH)})`}
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
