import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getVersion } from "../api/version";
import type { VersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((resolved) => {
        if (isMounted) {
          setInfo(resolved);
        }
      })
      .catch(() => {
        // An unresolved version leaves the footer showing the app name only.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {info && <span data-testid="app-footer-version"> v{info.version}</span>}
      {info?.commit && (
        <span data-testid="app-footer-commit"> ({info.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
