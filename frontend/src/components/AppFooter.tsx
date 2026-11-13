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
  // null covers both "still loading" and "could not be resolved": the footer
  // then shows the app name alone, never a placeholder or a failure marker.
  // The version and the commit arrive together, so one value carries both.
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) {
          setBackendVersion(resolved);
        }
      })
      .catch(() => {
        // Unresolved version: keep the name-only footer.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  let text = APP_NAME;
  if (backendVersion) {
    text = `${APP_NAME} v${backendVersion.version}`;
    if (backendVersion.commit) {
      text += ` (${backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})`;
    }
  }

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {text}
    </footer>
  );
}

export default AppFooter;
