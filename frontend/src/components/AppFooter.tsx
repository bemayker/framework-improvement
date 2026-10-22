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
  // Null while loading, after a failed fetch and for the backend's "unknown"
  // sentinel: in all three the footer shows the app name alone.
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((backendVersion) => {
        if (isMounted) {
          setVersion(backendVersion);
        }
      })
      .catch(() => {
        // Non-critical: the footer degrades to the name-only form.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {version ? `${APP_NAME} v${version}` : APP_NAME}
    </footer>
  );
}

export default AppFooter;
