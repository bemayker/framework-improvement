import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  getVersion,
  UNKNOWN_BACKEND_COMMIT,
  UNKNOWN_BACKEND_VERSION,
} from "../api/version";
import type { VersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

// The backend sends up to 12 characters; 7 is the conventional short commit
// and enough to recognise a build at a glance.
const COMMIT_DISPLAY_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

// While loading, on failure and on the backend's "unknown" answer the footer
// shows the app name alone: it stays a non-empty landmark and shows no
// version-shaped placeholder. The commit arrives in the same response as the
// version, so it is shown only next to a known version, and only when real.
function AppFooter() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((resolved) => {
        if (isMounted && resolved.version !== UNKNOWN_BACKEND_VERSION) {
          setInfo(resolved);
        }
      })
      .catch(() => {
        // Unresolved version is a supported state, not an error to surface.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const shortCommit =
    info?.commit && info.commit !== UNKNOWN_BACKEND_COMMIT
      ? info.commit.slice(0, COMMIT_DISPLAY_LENGTH)
      : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info && <span data-testid="app-version"> v{info.version}</span>}
      {info && shortCommit && <span data-testid="app-commit"> ({shortCommit})</span>}
    </footer>
  );
}

export default AppFooter;
