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

    // Loading and failure both leave the version null: the footer shows the
    // app name alone rather than a placeholder or "unknown".
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setVersion(resolved);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version ? (
        <>
          {" "}
          <span data-testid="app-version">v{version}</span>
        </>
      ) : null}
    </footer>
  );
}

export default AppFooter;
