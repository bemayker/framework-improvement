import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchVersion } from "../api/version";
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

    // On failure the info stays null: the footer then shows the app name alone.
    fetchVersion()
      .then((resolvedInfo) => {
        if (isMounted) {
          setInfo(resolvedInfo);
        }
      })
      .catch(() => undefined);

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
      {/* typeof check: a partial result must never render "(undefined)". */}
      {info !== null && typeof info.commit === "string" && (
        <span data-testid="app-footer-commit"> ({info.commit})</span>
      )}
    </footer>
  );
}

export default AppFooter;
