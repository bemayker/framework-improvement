import { useEffect, useState, type CSSProperties } from "react";
import { getVersion } from "../api/version";

const APP_NAME = "Task Notes";
const VERSION_UNAVAILABLE_MESSAGE = "version unavailable";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

type VersionState =
  | { status: "loading" }
  | { status: "resolved"; version: string }
  | { status: "unavailable" };

function AppFooter() {
  const [versionState, setVersionState] = useState<VersionState>({
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((version) => {
        if (isMounted) {
          setVersionState({ status: "resolved", version });
        }
      })
      .catch(() => {
        // The failure is rendered rather than logged: a reader who sees
        // "version unavailable" knows the backend did not answer, which is the
        // question a version string is read to settle.
        if (isMounted) {
          setVersionState({ status: "unavailable" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME}
      {versionState.status === "resolved" && (
        <>
          {" "}
          <span data-testid="app-footer-version">v{versionState.version}</span>
        </>
      )}
      {versionState.status === "unavailable" && (
        <>
          {" · "}
          <span data-testid="app-footer-version-unavailable">
            {VERSION_UNAVAILABLE_MESSAGE}
          </span>
        </>
      )}
    </footer>
  );
}

export default AppFooter;
