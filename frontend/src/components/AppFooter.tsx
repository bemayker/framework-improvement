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
  // null covers pending, failed and unknown alike: the footer then shows only
  // the app name, so it is never blank and never prints a misleading value.
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((resolved) => {
        if (isMounted) setVersion(resolved);
      })
      .catch(() => {
        // Leave the version unresolved; the footer renders without it.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version ? <span data-testid="app-version"> v{version}</span> : null}
    </footer>
  );
}

export default AppFooter;
