import { useEffect, useState, type CSSProperties } from "react";
import { fetchVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend's own "could not resolve a version" sentinel
// (version_service.UNKNOWN_VERSION); it is treated like a failed request.
const UNRESOLVED_VERSION = "unknown";

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
      .then((info) => {
        if (isMounted && info.version !== UNRESOLVED_VERSION) {
          setVersion(info.version);
        }
      })
      .catch(() => {
        // Pending and failed look the same on purpose: the footer shows the
        // app name alone rather than a placeholder or an empty gap.
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
