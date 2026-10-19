import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchAppVersion } from "../api/version";
import type { AppVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // While loading, and whenever the version cannot be resolved, the footer
  // shows the app name alone: no placeholder, no "unknown". The short commit
  // is shown only next to a resolved version and only when the backend has one.
  const [info, setInfo] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchAppVersion()
      .then((resolved) => {
        if (isMounted) setInfo(resolved);
      })
      .catch(() => {
        if (isMounted) setInfo(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info !== null && (
        <span data-testid="app-footer-version"> v{info.version}</span>
      )}
      {info !== null && info.commit !== null && (
        <span data-testid="app-footer-commit"> ({info.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
