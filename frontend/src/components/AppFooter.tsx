import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchAppVersion } from "../api/version";
import type { AppVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

const SHORT_COMMIT_LENGTH = 7;

function footerText(appVersion: AppVersion | null): string {
  if (appVersion === null) {
    return APP_NAME;
  }
  const withVersion = `${APP_NAME} v${appVersion.version}`;
  if (appVersion.commit === null) {
    return withVersion;
  }
  return `${withVersion} (${appVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})`;
}

function AppFooter() {
  // null covers loading and failure alike: the footer shows the name alone
  // rather than a placeholder a reader could mistake for a version.
  const [version, setVersion] = useState<AppVersion | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchAppVersion().then((resolved) => {
      if (isMounted) {
        setVersion(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {footerText(version)}
    </footer>
  );
}

export default AppFooter;
