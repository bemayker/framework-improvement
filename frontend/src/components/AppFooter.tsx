import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchVersion } from "../api/version";
import type { VersionInfo } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

// The backend reports this placeholder for the version when its distribution is not
// installed, and for the commit when BUILD_COMMIT is unset.
const UNKNOWN_SENTINEL = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function shortCommit(commit: string | null): string | null {
  if (commit === null || commit.trim() === "" || commit === UNKNOWN_SENTINEL) {
    return null;
  }
  return commit.trim().slice(0, SHORT_COMMIT_LENGTH);
}

function AppFooter() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchVersion()
      .then((value) => {
        if (
          isMounted &&
          value.version.trim() !== "" &&
          value.version !== UNKNOWN_SENTINEL
        ) {
          setInfo(value);
        }
      })
      .catch(() => {
        // Loading and failure render the same text: without a version.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const commit = info ? shortCommit(info.commit) : null;

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info && <span data-testid="app-footer-version"> v{info.version}</span>}
      {info && commit && <span data-testid="app-footer-commit"> ({commit})</span>}
    </footer>
  );
}

export default AppFooter;
