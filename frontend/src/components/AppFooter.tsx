import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersionInfo } from "../api/version";
import type { BackendVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

// The backend's own sentinel for "package metadata not installed"
// (version_service.UNKNOWN_VERSION); it is not a version worth showing.
const UNKNOWN_VERSION = "unknown";

// The backend's default when BUILD_COMMIT is unset
// (backend/app/core/config.py DEFAULT_BUILD_COMMIT); not a commit worth showing.
const UNKNOWN_COMMIT = "unknown";

// The API returns up to 12 characters; 7 is the display length, a UI concern.
const COMMIT_DISPLAY_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers both the pending and the failed request: the footer then
  // shows the name alone rather than a placeholder or an empty gap.
  const [info, setInfo] = useState<BackendVersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersionInfo()
      .then((backendInfo) => {
        if (isMounted && backendInfo.version !== UNKNOWN_VERSION) {
          setInfo(backendInfo);
        }
      })
      .catch(() => {
        // Intentionally unresolved: the name-only footer is the failure state.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const commit =
    info?.commit != null && info.commit !== UNKNOWN_COMMIT ? info.commit : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info !== null && (
        <span data-testid="app-footer-version">{` v${info.version}`}</span>
      )}
      {info !== null && commit !== null && (
        <span data-testid="app-footer-commit">
          {` (${commit.slice(0, COMMIT_DISPLAY_LENGTH)})`}
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
