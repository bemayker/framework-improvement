import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendBuildInfo } from "../api/version";
import type { BackendBuildInfo } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // Null covers loading and every failure alike: the footer then reads the app
  // name alone rather than a placeholder, "unknown" or an empty gap.
  const [buildInfo, setBuildInfo] = useState<BackendBuildInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendBuildInfo()
      .then((backendBuildInfo) => {
        if (isMounted) {
          setBuildInfo(backendBuildInfo);
        }
      })
      .catch(() => {
        // Unresolved build info is a supported state, not an error to surface.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const version = buildInfo?.version;
  const commit = buildInfo?.commit;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version ? (
        <>
          {" "}
          <span data-testid="app-footer-version">v{version}</span>
          {commit ? (
            <>
              {" "}
              <span data-testid="app-footer-commit">
                ({commit.slice(0, SHORT_COMMIT_LENGTH)})
              </span>
            </>
          ) : null}
        </>
      ) : null}
    </footer>
  );
}

export default AppFooter;
