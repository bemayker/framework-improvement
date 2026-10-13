import { useEffect, useState, type CSSProperties } from "react";
import { fetchVersion, type VersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

// The backend's own "could not resolve a version" sentinel
// (version_service.UNKNOWN_VERSION); it is treated like a failed request.
const UNRESOLVED_VERSION = "unknown";

// The backend's "could not resolve a commit" sentinel; a footer with no real
// commit shows the version alone.
const UNRESOLVED_COMMIT = "unknown";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function footerText(info: VersionInfo | null): string {
  if (info === null) {
    return APP_NAME;
  }

  const base = `${APP_NAME} v${info.version}`;
  const { commit } = info;

  if (
    typeof commit !== "string" ||
    commit.trim() === "" ||
    commit === UNRESOLVED_COMMIT
  ) {
    return base;
  }

  return `${base} (${commit.slice(0, SHORT_COMMIT_LENGTH)})`;
}

function AppFooter() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchVersion()
      .then((resolved) => {
        if (isMounted && resolved.version !== UNRESOLVED_VERSION) {
          setInfo(resolved);
        }
      })
      .catch(() => {
        // Pending and failed look the same on purpose: the footer shows the
        // app name alone rather than a placeholder or an empty gap.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {footerText(info)}
    </footer>
  );
}

export default AppFooter;
