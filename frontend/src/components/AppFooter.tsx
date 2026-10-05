import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { getBackendVersion } from "../api/version";

const APP_NAME = "Task Notes";
const VERSION_UNAVAILABLE_TEXT = "version unavailable";
const SEPARATOR = " · ";

type VersionStatus =
  | { kind: "loading" }
  | { kind: "ready"; version: string }
  | { kind: "unavailable" };

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [status, setStatus] = useState<VersionStatus>({ kind: "loading" });

  useEffect(() => {
    let isMounted = true;

    getBackendVersion()
      .then((version) => {
        if (!isMounted) return;
        setStatus(
          version === null
            ? { kind: "unavailable" }
            : { kind: "ready", version },
        );
      })
      .catch(() => {
        if (isMounted) setStatus({ kind: "unavailable" });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {status.kind === "ready" && (
        <>
          {" v"}
          <span data-testid="app-footer-version">{status.version}</span>
        </>
      )}
      {status.kind === "unavailable" &&
        `${SEPARATOR}${VERSION_UNAVAILABLE_TEXT}`}
    </footer>
  );
}

export default AppFooter;
