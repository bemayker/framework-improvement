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
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBackend(resolved);
      })
      .catch(() => {
        // Deliberate: the version is supplementary, so an unresolved one
        // leaves the footer at the app name instead of breaking the page.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backend ? (
        <span data-testid="app-footer-version"> v{backend.version}</span>
      ) : null}
      {backend?.commit ? (
        <span data-testid="app-footer-commit">
          {" "}
          ({backend.commit.slice(0, SHORT_COMMIT_LENGTH)})
        </span>
      ) : null}
    </footer>
  );
}

export default AppFooter;
