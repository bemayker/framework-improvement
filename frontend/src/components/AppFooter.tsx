import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchVersion } from "../api/version";
import type { VersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const SHORT_COMMIT_LENGTH = 7;

// What the backend reports when its package metadata is not installed.
const UNKNOWN_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchVersion()
      .then((resolved) => {
        if (isMounted && resolved.version !== UNKNOWN_VERSION) {
          setInfo(resolved);
        }
      })
      .catch(() => {
        // Name-only footer is the intended rendering when the version is unresolved.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {info === null ? APP_NAME : `${APP_NAME} v${info.version}`}
      {info?.commit != null && (
        <>
          {" ("}
          <span data-testid="app-footer-commit">
            {info.commit.slice(0, SHORT_COMMIT_LENGTH)}
          </span>
          {")"}
        </>
      )}
    </footer>
  );
}

export default AppFooter;
