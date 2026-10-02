import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { VersionInfo } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers both "still loading" and "could not be resolved": either way
  // the footer shows the app name alone, never a placeholder or "unknown".
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) {
          setInfo(resolved);
        }
      })
      .catch(() => {
        // Unresolved version: render without it (AC3).
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info !== null && (
        <>
          {" v"}
          <span data-testid="app-version">{info.version}</span>
          {info.commit !== null && (
            <>
              {" ("}
              <span data-testid="app-commit">
                {info.commit.slice(0, SHORT_COMMIT_LENGTH)}
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
