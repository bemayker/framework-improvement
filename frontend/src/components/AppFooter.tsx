import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendBuildInfo } from "../api/version";
import type { BuildInfo } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

/** The commit is only ever shown beside a known version, never on its own. */
function footerText(info: BuildInfo | null): string {
  if (info === null) {
    return APP_NAME;
  }
  if (info.commit === null) {
    return `${APP_NAME} v${info.version}`;
  }
  return `${APP_NAME} v${info.version} (${info.commit})`;
}

function AppFooter() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendBuildInfo().then((resolved) => {
      if (isMounted) {
        setBuildInfo(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {footerText(buildInfo)}
    </footer>
  );
}

export default AppFooter;
