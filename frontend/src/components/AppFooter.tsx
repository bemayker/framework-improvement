import { useEffect, useState, type CSSProperties } from "react";
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
      .then((backendVersion) => {
        if (isMounted) {
          setVersion(backendVersion);
        }
      })
      .catch(() => {
        // While pending and on failure the footer shows the app name alone:
        // the version is a label, so an unreachable backend is not an error.
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
      {version ? `${APP_NAME} v${version}` : APP_NAME}
    </footer>
  );
}

export default AppFooter;
