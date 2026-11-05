import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend reports this when its package metadata is absent; it is not a
// version, so the footer treats it the same as a failed lookup.
const UNKNOWN_BACKEND_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((response) => {
        if (isMounted && response.version !== UNKNOWN_BACKEND_VERSION) {
          setVersion(response.version);
        }
      })
      .catch(() => {
        // Unresolvable version: keep showing the app name alone.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null ? ` v${version}` : null}
    </footer>
  );
}

export default AppFooter;
