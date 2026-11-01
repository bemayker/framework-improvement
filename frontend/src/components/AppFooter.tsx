import { useEffect, useState, type CSSProperties } from "react";
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

    fetchBackendVersion()
      .then((resolvedVersion) => {
        if (isMounted) {
          setBackendVersion(resolvedVersion);
        }
      })
      .catch(() => {
        // The footer's answer to an unreachable or failing backend is the app
        // name alone, identical to the loading state: a missing version is not
        // an error worth surfacing, and showing "unknown" would read as a
        // version string.
        if (isMounted) {
          setBackendVersion(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backendVersion !== null && (
        <span data-testid="app-footer-version"> v{backendVersion}</span>
      )}
    </footer>
  );
}

export default AppFooter;
