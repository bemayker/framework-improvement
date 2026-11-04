import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendBuildInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers pending, failed and unresolved-version alike: the footer then shows
  // the app name alone rather than a placeholder that looks like a version.
  const [buildInfo, setBuildInfo] = useState<BackendBuildInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBuildInfo(resolved);
      })
      .catch(() => {
        if (isMounted) setBuildInfo(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {buildInfo !== null && (
        <>
          <span data-testid="app-footer-version">{` v${buildInfo.version}`}</span>
          {buildInfo.commit !== null && (
            <span data-testid="app-footer-commit">{` (${buildInfo.commit})`}</span>
          )}
        </>
      )}
    </footer>
  );
}

export default AppFooter;
