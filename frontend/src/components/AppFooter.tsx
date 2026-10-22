import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { version } from "../../package.json";
import { getStamp } from "../api/stamp";
import type { Stamp } from "../api/stamp";

const APP_NAME = "Task Notes";

const footerStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  marginTop: "1.5rem",
};

function AppFooter() {
  const [stamp, setStamp] = useState<Stamp | null>(null);

  useEffect(() => {
    let isMounted = true;

    getStamp()
      .then((loaded) => {
        if (isMounted) {
          setStamp(loaded);
        }
      })
      .catch(() => {
        // The footer must never break the page: a failed request shows no stamp.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer data-testid="app-footer" style={footerStyle}>
      {APP_NAME} v{version}
      {stamp !== null && (
        <>
          {" · "}
          <span data-testid="app-footer-stamp">stamp: {stamp.stamp}</span>
        </>
      )}
    </footer>
  );
}

export default AppFooter;
