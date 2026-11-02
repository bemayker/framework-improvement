import { useEffect, useState, type CSSProperties } from "react";
import { getBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend's own sentinel for "distribution metadata missing".
const UNRESOLVED_VERSION = "unknown";

// The backend's sentinel for an unset build commit. It is exactly as long as a
// short commit, so truncating it would show "(unknown)" as if it were a commit.
const UNRESOLVED_COMMIT = "unknown";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

type VersionInfo = { version: string; commit: string | null };

function toShortCommit(commit?: string): string | null {
  if (!commit || commit === UNRESOLVED_COMMIT) {
    return null;
  }
  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

function AppFooter() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then(({ version, commit }) => {
        if (isMounted && version && version !== UNRESOLVED_VERSION) {
          setVersionInfo({ version, commit: toShortCommit(commit) });
        }
      })
      .catch(() => {
        // Loading and failure render the same app-name-only footer, so a
        // failed request needs no state of its own.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {versionInfo !== null && (
        <span data-testid="app-footer-version"> v{versionInfo.version}</span>
      )}
      {versionInfo?.commit != null && (
        <span data-testid="app-footer-commit"> ({versionInfo.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
