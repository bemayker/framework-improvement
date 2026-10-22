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
  const [build, setBuild] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    // One request supplies version and commit. Loading and failure both leave
    // the build null: the footer shows the app name alone rather than a
    // placeholder or "unknown". An unusable commit is null and is omitted.
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setBuild(resolved);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {build ? (
        <>
          {" "}
          <span data-testid="app-version">v{build.version}</span>
          {build.commit ? (
            <>
              {" "}
              <span data-testid="app-commit">
                ({build.commit.slice(0, SHORT_COMMIT_LENGTH)})
              </span>
            </>
          ) : null}
        </>
      ) : null}
    </footer>
  );
}

export default AppFooter;
