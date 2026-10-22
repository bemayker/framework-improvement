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
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolvedVersion) => {
        if (isMounted) {
          setVersion(resolvedVersion);
        }
      })
      .catch(() => {
        // Silent on purpose: an unresolvable version renders the footer
        // without it, never an error or placeholder (TEST-08 criteria 3 and 5).
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && <span data-testid="app-version"> v{version}</span>}
    </footer>
  );
}

export default AppFooter;
