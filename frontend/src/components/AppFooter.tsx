import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getAppVersion } from "../api/version";
import type { AppVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [info, setInfo] = useState<AppVersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAppVersion()
      .then((resolved) => {
        if (isMounted) setInfo(resolved);
      })
      .catch(() => {
        // Loading and failure look the same by design: the name, no version.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info?.version != null && (
        <span data-testid="app-footer-version"> v{info.version}</span>
      )}
      {info?.version != null && info.commit !== null && (
        <span data-testid="app-footer-commit"> ({info.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
