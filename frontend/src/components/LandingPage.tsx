import type { CSSProperties } from "react";
import AppFooter from "./AppFooter";
import NoteForm from "./NoteForm";
import NoteList from "./NoteList";
import { useNotes } from "../hooks/useNotes";

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

const notesSectionStyle: CSSProperties = {
  width: "100%",
  maxWidth: "32rem",
  marginTop: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  textAlign: "left",
};

const statusTextStyle: CSSProperties = {
  color: "#5f5f5f",
  fontSize: "0.9rem",
};

const submitErrorStyle: CSSProperties = {
  color: "#b3261e",
  fontSize: "0.875rem",
  margin: 0,
};

function LandingPage() {
  const { notes, isLoading, loadError, submitError, addNote } = useNotes();

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
        <section data-testid="notes-section" style={notesSectionStyle}>
          <NoteForm onSubmit={addNote} />
          {submitError && (
            <p data-testid="note-submit-error" role="alert" style={submitErrorStyle}>
              {submitError}
            </p>
          )}
          {isLoading ? (
            <p data-testid="note-list-loading" style={statusTextStyle}>
              Loading notes…
            </p>
          ) : loadError ? (
            <p data-testid="note-list-error" role="alert" style={submitErrorStyle}>
              {loadError}
            </p>
          ) : (
            <NoteList notes={notes} />
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

export default LandingPage;
