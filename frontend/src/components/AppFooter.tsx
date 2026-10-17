import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchAppVersion } from "../api/version";
import type { AppVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers both loading and failure: the footer shows the app name alone.
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchAppVersion()
      .then((resolved) => {
        if (isMounted) {
          setAppVersion(resolved);
        }
      })
      .catch(() => {
        // A failed lookup leaves the version unset; the footer stays valid.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {appVersion !== null && (
        <span data-testid="app-version"> v{appVersion.version}</span>
      )}
      {appVersion?.commit != null && (
        <span data-testid="app-commit"> ({appVersion.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
