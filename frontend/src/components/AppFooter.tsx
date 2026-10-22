import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

const SHORT_COMMIT_LENGTH = 7;

function footerText(backendVersion: BackendVersion | null): string {
  if (!backendVersion?.version) {
    return APP_NAME;
  }
  const withVersion = `${APP_NAME} v${backendVersion.version}`;
  return backendVersion.commit
    ? `${withVersion} (${backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})`
    : withVersion;
}

function AppFooter() {
  // Null while loading and after a failed fetch; a resolved object without a
  // version (the backend's "unknown" sentinel) also shows the app name alone.
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
        // Non-critical: the footer degrades to the name-only form.
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
