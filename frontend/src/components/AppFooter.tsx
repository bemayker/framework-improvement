import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getVersion } from "../api/version";
import type { VersionResponse } from "../api/version";

const APP_NAME = "Task Notes";
const COMMIT_DISPLAY_LENGTH = 7;

// The backend reports this literal for both fields when it cannot resolve
// them (package metadata absent, BUILD_COMMIT unset); it is not a version or
// a commit, so the footer treats an unknown version as a failed lookup and
// an unknown commit as absent.
const UNKNOWN_BACKEND_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [versionInfo, setVersionInfo] = useState<VersionResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((response) => {
        if (isMounted && response.version !== UNKNOWN_BACKEND_VERSION) {
          setVersionInfo(response);
        }
      })
      .catch(() => {
        // Unresolvable version: keep showing the app name alone.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const commit = versionInfo?.commit;
  const shortCommit =
    commit && commit !== UNKNOWN_BACKEND_VERSION
      ? commit.slice(0, COMMIT_DISPLAY_LENGTH)
      : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {versionInfo !== null ? ` v${versionInfo.version}` : null}
      {versionInfo !== null && shortCommit !== null ? ` (${shortCommit})` : null}
    </footer>
  );
}

export default AppFooter;
