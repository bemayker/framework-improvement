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

function AppFooter() {
  // null covers loading and failure alike: the footer then shows the app name
  // alone, never a placeholder or the word "unknown". Version and commit come
  // from one response, so they are present or absent together, except that a
  // missing commit leaves the version alone.
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchAppVersion()
      .then((fetchedVersion) => {
        if (isMounted) setAppVersion(fetchedVersion);
      })
      .catch(() => {
        if (isMounted) setAppVersion(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {appVersion !== null && ` v${appVersion.version}`}
      {appVersion?.commit != null && ` (${appVersion.commit})`}
    </footer>
  );
}

export default AppFooter;
