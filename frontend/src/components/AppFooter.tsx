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
  // null means loading or unresolved; both render the app name alone.
  const [backend, setBackend] = useState<BackendVersion | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchBackendVersion().then((resolved) => {
      if (isMounted) {
        setBackend(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {backend !== null && <> v{backend.version}</>}
      {backend !== null && backend.commit !== null && <> ({backend.commit})</>}
    </footer>
  );
}

export default AppFooter;
