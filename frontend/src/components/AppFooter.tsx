import type { CSSProperties } from "react";
import { version } from "../../package.json";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME} v{version}
    </footer>
  );
}

export default AppFooter;
