import type { CSSProperties } from "react";
import AppFooter from "./AppFooter";
import NoteForm from "./NoteForm";
import NoteList from "./NoteList";
import { useNotes } from "../hooks/useNotes";

/** User-facing strings, kept together so they can be moved to i18n resources. */
const LABELS = {
  notesHeading: "Notes",
  loading: "Loading notes…",
} as const;

const containerStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
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

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  marginTop: "2rem",
  width: "100%",
  maxWidth: "32rem",
};

const sectionHeadingStyle: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  textAlign: "left",
  margin: 0,
};

const statusStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#5f5f5f",
  textAlign: "left",
  margin: 0,
};

const errorStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#b3261e",
  textAlign: "left",
  margin: 0,
};

function LandingPage() {
  const { notes, addNote, isLoading, loadError, submitError } = useNotes();

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
        <section data-testid="notes-section" style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>{LABELS.notesHeading}</h2>
          <NoteForm onSubmit={addNote} submitError={submitError} />
          {isLoading ? (
            <p data-testid="notes-loading" style={statusStyle}>
              {LABELS.loading}
            </p>
          ) : (
            <NoteList notes={notes} />
          )}
          {loadError !== null && (
            <p data-testid="notes-load-error" style={errorStyle} role="alert">
              {loadError}
            </p>
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

export default LandingPage;
