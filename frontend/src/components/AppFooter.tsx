import { useEffect, useState, type CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers both loading and failure: the footer then shows the app name
  // only, never a placeholder, `unknown` or a trailing " v".
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
        // An unreachable backend must not break the footer; it keeps the name.
        if (isMounted) {
          setVersion(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {version === null ? APP_NAME : `${APP_NAME} v${version}`}
    </footer>
  );
}

export default AppFooter;
