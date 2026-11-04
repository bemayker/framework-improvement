import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendBuildInfo } from "../api/version";
import type { BackendBuildInfo } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers both "still loading" and "request failed": either way the
  // footer shows the app name only, never blank and never "unknown".
  const [buildInfo, setBuildInfo] = useState<BackendBuildInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendBuildInfo()
      .then((info) => {
        if (isMounted) {
          setBuildInfo(info);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBuildInfo(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = buildInfo?.version ?? null;
  // The commit is only shown next to a resolved version.
  const commit = version !== null ? (buildInfo?.commit ?? null) : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && <span data-testid="app-footer-version"> v{version}</span>}
      {commit !== null && (
        <span data-testid="app-footer-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>
      )}
    </footer>
  );
}

export default AppFooter;
