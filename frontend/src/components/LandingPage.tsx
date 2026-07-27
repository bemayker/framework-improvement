import type { CSSProperties } from "react";
import NotesSection from "./NotesSection";

const containerStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "1.5rem",
  textAlign: "center",
  fontFamily: "system-ui, -apple-system, sans-serif",
  color: "#1a1a1a",
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(2rem, 6vw, 3rem)",
  fontWeight: 700,
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  fontSize: "1rem",
  color: "#5f5f5f",
  marginTop: "0.75rem",
  maxWidth: "32rem",
};

function LandingPage() {
  return (
    <div data-testid="landing-page" style={containerStyle}>
      <header>
        <h1 data-testid="landing-title" style={titleStyle}>
          Task Notes
        </h1>
      </header>
      <main>
        <p style={subtitleStyle}>
          A minimal task-notes app for keeping track of what needs doing.
        </p>
        <NotesSection />
      </main>
    </div>
  );
}

export default LandingPage;
