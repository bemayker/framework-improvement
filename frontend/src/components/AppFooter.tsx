import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The API returns up to 12 commit characters; "short commit" is a display rule.
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function footerText(backendVersion: BackendVersion | null): string {
  if (!backendVersion) {
    return APP_NAME;
  }
  const label = `${APP_NAME} v${backendVersion.version}`;
  return backendVersion.commit
    ? `${label} (${backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})`
    : label;
}

function AppFooter() {
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    // Pending and failed both leave the version null: the footer then shows
    // the app name alone.
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) {
          setBackendVersion(resolved);
        }
      })
      .catch(() => undefined);

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
