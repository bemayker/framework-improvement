import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

// The commit is only shown next to a version, never on its own.
function footerText(info: BackendVersionInfo | null): string {
  if (!info) {
    return APP_NAME;
  }

  const withVersion = `${APP_NAME} v${info.version}`;
  return info.commit ? `${withVersion} (${info.commit})` : withVersion;
}

function AppFooter() {
  const [backendInfo, setBackendInfo] = useState<BackendVersionInfo | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    // On failure the version stays null and the footer shows the name alone.
    fetchBackendVersion()
      .then((resolved) => {
        if (isMounted) {
          setBackendInfo(resolved);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {footerText(backendInfo)}
    </footer>
  );
}

export default AppFooter;
