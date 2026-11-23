import { useEffect, useState, type CSSProperties } from "react";
import { fetchBackendVersion, type BackendVersion } from "../api/version";

const APP_NAME = "Task Notes";

/** How many characters of the build commit the footer displays. */
const SHORT_COMMIT_LENGTH = 7;

/** The commit is shown only next to a known version, never on its own. */
function footerText({ version, commit }: BackendVersion): string {
  if (!version) {
    return APP_NAME;
  }
  const label = `${APP_NAME} v${version}`;
  return commit ? `${label} (${commit.slice(0, SHORT_COMMIT_LENGTH)})` : label;
}

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [backendVersion, setBackendVersion] = useState<BackendVersion>({
    version: null,
    commit: null,
  });

  useEffect(() => {
    let isMounted = true;

    fetchBackendVersion()
      .then((result) => {
        if (isMounted) {
          setBackendVersion(result);
        }
      })
      .catch(() => {
        // While pending and on failure the footer shows the app name alone:
        // the version is a label, so an unreachable backend is not an error.
        if (isMounted) {
          setBackendVersion({ version: null, commit: null });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {footerText(backendVersion)}
    </footer>
  );
}

export default AppFooter;
