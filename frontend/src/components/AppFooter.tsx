import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchVersion } from "../api/version";

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

    // On failure the version stays null: the footer then shows the app name alone.
    fetchVersion()
      .then((resolvedVersion) => {
        if (isMounted) {
          setVersion(resolvedVersion);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version !== null && (
        <span data-testid="app-footer-version"> v{version}</span>
      )}
    </footer>
  );
}

export default AppFooter;
