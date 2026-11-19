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
  // null covers loading, failure and the backend's unknown sentinel alike:
  // all three render the app name alone, never a placeholder.
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((version) => {
        if (isMounted) {
          setBackendVersion(version);
        }
      })
      .catch(() => {
        // Version is informational: stay on the name-only footer.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {backendVersion === null ? APP_NAME : `${APP_NAME} v${backendVersion}`}
    </footer>
  );
}

export default AppFooter;
