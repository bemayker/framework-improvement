import type { CSSProperties } from "react";
import { version as packageVersion } from "../../package.json";

const APP_NAME = "Task Notes";

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

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {trimmedVersion !== "" ? `${APP_NAME} v${trimmedVersion}` : APP_NAME}
    </footer>
  );
}

export default AppFooter;
