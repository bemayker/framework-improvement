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

// The commit is shown only next to a known version; without one it is omitted.
function footerText(backendVersion: BackendVersion | null): string {
  if (backendVersion === null) {
    return APP_NAME;
  }
  const label = `${APP_NAME} v${backendVersion.version}`;
  return backendVersion.commit === null
    ? label
    : `${label} (${backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})`;
}

function AppFooter() {
  // null covers loading, failure and the backend's unknown sentinel alike:
  // all three render the app name alone, never a placeholder.
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((version) => {
        if (isMounted) {
          setBackendVersion(version);
        }
      })
      .catch(() => {
        // Version is informational: stay on the name-only footer.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {footerText(backendVersion)}
    </footer>
  );
}

export default AppFooter;
