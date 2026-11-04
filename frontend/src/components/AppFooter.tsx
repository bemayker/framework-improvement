import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers pending, failed and unresolved alike: the footer then shows the
  // app name alone rather than a placeholder that looks like a version.
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setVersion(resolved);
      })
      .catch(() => {
        if (isMounted) setVersion(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <span data-testid="app-footer-version">{` v${version}`}</span>
      )}
    </footer>
  );
}

export default AppFooter;
