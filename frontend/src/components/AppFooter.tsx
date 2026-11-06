import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";
// The backend's sentinel for missing package metadata; it is not a version.
const UNKNOWN_VERSION = "unknown";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function isDisplayableVersion(version: string | null): version is string {
  return version !== null && version !== "" && version !== UNKNOWN_VERSION;
}

function AppFooter() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) setVersion(resolved);
      })
      .catch(() => {
        // Unresolved version: the footer keeps showing the app name alone.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const versionSuffix = isDisplayableVersion(version) ? ` v${version}` : "";

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {`${APP_NAME}${versionSuffix}`}
    </footer>
  );
}

export default AppFooter;
