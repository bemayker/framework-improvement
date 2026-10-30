import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((backendVersion) => {
        if (isMounted) setVersion(backendVersion);
      })
      .catch(() => {
        // The footer is informational: an unreachable backend shows the app
        // name alone, the same render as while the request is in flight.
        if (isMounted) setVersion(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <>
          {" "}
          <span data-testid="app-version">v{version}</span>
        </>
      )}
    </footer>
  );
}

export default AppFooter;
