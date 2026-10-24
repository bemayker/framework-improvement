import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchAppVersion } from "../api/version";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // null covers loading and failure alike: the footer shows the name alone
  // rather than a placeholder a reader could mistake for a version.
  const [version, setVersion] = useState<string | null>(null);

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
      {version === null ? APP_NAME : `${APP_NAME} v${version}`}
    </footer>
  );
}

export default AppFooter;
