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
  // null covers both "still loading" and "could not be resolved": the footer
  // then shows the app name alone, never a placeholder or a failure marker.
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
        // Unresolved version: keep the name-only footer.
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
