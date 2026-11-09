import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((version) => {
        if (isMounted) {
          setBackendVersion(version);
        }
      })
      .catch(() => {
        // The footer degrades to the app name; it never blocks the page.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backendVersion ? ` v${backendVersion.version}` : null}
      {backendVersion?.shortCommit ? ` (${backendVersion.shortCommit})` : null}
    </footer>
  );
}

export default AppFooter;
