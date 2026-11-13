import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchVersion } from "../api/version";

const APP_NAME = "Task Notes";

// What the backend reports when its package metadata is not installed.
const UNKNOWN_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchVersion()
      .then((resolved) => {
        if (isMounted && resolved !== UNKNOWN_VERSION) {
          setVersion(resolved);
        }
      })
      .catch(() => {
        // Name-only footer is the intended rendering when the version is unresolved.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {version === null ? APP_NAME : `${APP_NAME} v${version}`}
    </footer>
  );
}

export default AppFooter;
