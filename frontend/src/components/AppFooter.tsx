import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend reports this placeholder when its distribution is not installed.
const UNKNOWN_SENTINEL = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchVersion()
      .then((value) => {
        if (isMounted && value.trim() !== "" && value !== UNKNOWN_SENTINEL) {
          setVersion(value);
        }
      })
      .catch(() => {
        // Loading and failure render the same text: without a version.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {version && <span data-testid="app-footer-version"> v{version}</span>}
    </footer>
  );
}

export default AppFooter;
