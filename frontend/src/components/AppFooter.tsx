import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendBuildInfo } from "../api/version";
import type { BuildInfo } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null means pending or unresolved; both render the app name alone.
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendBuildInfo()
      .then((resolved) => {
        if (isMounted) {
          setBuildInfo(resolved);
        }
      })
      .catch(() => {
        // Unresolved version: the footer keeps showing the app name only.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {buildInfo !== null && (
        <span data-testid="app-footer-version"> v{buildInfo.version}</span>
      )}
      {buildInfo?.commit != null && (
        <span data-testid="app-footer-commit">
          {` (${buildInfo.commit.slice(0, SHORT_COMMIT_LENGTH)})`}
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
