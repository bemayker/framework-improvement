import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchBackendVersion } from "../api/version";
import type { BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

// The backend sends up to 12 characters; the footer shows the conventional short form.
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  // Null covers both loading and failure: the footer shows the name alone.
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion().then((resolved) => {
      if (isMounted) {
        setBackendVersion(resolved);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  let text = APP_NAME;
  if (backendVersion !== null) {
    text = `${APP_NAME} v${backendVersion.version}`;
    if (backendVersion.commit !== null) {
      text += ` (${backendVersion.commit.slice(0, SHORT_COMMIT_LENGTH)})`;
    }
  }

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {text}
    </footer>
  );
}

export default AppFooter;
