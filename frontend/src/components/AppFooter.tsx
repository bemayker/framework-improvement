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
        // Silent on purpose: an unresolvable version renders the footer
        // without it, never an error or placeholder (TEST-08 criteria 3 and 5,
        // TEST-10 criterion 2).
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = backendVersion?.version ?? null;
  const commit = backendVersion?.commit ?? null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && <span data-testid="app-version"> v{version}</span>}
      {version !== null && commit !== null && (
        <span data-testid="app-commit">
          {" "}
          ({commit.slice(0, SHORT_COMMIT_LENGTH)})
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
