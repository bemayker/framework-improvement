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
  // null covers loading and every unresolved outcome: all render the name alone.
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((resolved) => {
        if (isMounted) setVersion(resolved);
      })
      .catch(() => {
        if (isMounted) setVersion(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && ` v${version}`}
    </footer>
  );
}

export default AppFooter;
