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
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Pending and failed both leave the version null: the footer then shows
    // the app name alone.
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) {
          setBackendVersion(resolved);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {backendVersion ? `${APP_NAME} v${backendVersion}` : APP_NAME}
    </footer>
  );
}

export default AppFooter;
