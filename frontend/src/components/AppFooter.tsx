import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { version as packageVersion } from "../../package.json";
import { getVersionInfo } from "../api/version";

const APP_NAME = "Task Notes";
const SHORT_COMMIT_LENGTH = 7;

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

type AppFooterProps = {
  // Overridable so the unresolved-version path is testable without mocking the JSON module.
  version?: string | null;
};

function AppFooter({ version = packageVersion }: AppFooterProps) {
  const trimmedVersion = typeof version === "string" ? version.trim() : "";
  const [commit, setCommit] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersionInfo()
      .then((info) => {
        const shortCommit = info.commit.trim().slice(0, SHORT_COMMIT_LENGTH);
        if (isMounted && shortCommit !== "") {
          setCommit(shortCommit);
        }
      })
      .catch(() => {
        // Pending and failed both show the version alone, so there is nothing to set.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {trimmedVersion !== "" ? `${APP_NAME} v${trimmedVersion}` : APP_NAME}
      {commit !== null && (
        <>
          {" ("}
          <span data-testid="app-footer-commit">{commit}</span>
          {")"}
        </>
      )}
    </footer>
  );
}

export default AppFooter;
