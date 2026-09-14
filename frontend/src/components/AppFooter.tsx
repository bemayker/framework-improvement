import { useEffect, useState, type CSSProperties } from "react";
import { fetchVersion } from "../api/version";

const APP_NAME = "Task Notes";
const VERSION_UNAVAILABLE_LABEL = "version unavailable";

type VersionState =
  | { status: "loading" }
  | { status: "resolved"; version: string }
  | { status: "unavailable" };

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [versionState, setVersionState] = useState<VersionState>({
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;

    fetchVersion()
      .then((version) => {
        if (isMounted) {
          setVersionState({ status: "resolved", version });
        }
      })
      .catch(() => {
        // The version is a label, not a feature: an unreachable or unusable
        // endpoint is reported in the footer itself rather than escalated, and
        // nothing version-shaped is rendered from an unresolved value.
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
        <span data-testid="app-footer-version"> v{versionState.version}</span>
      )}
      {versionState.status === "unavailable" && (
        <span data-testid="app-footer-version-unavailable">
          {" "}
          · {VERSION_UNAVAILABLE_LABEL}
        </span>
      )}
    </footer>
  );
}

export default AppFooter;
