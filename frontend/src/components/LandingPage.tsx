import { useEffect, useState, type CSSProperties } from "react";
import AppFooter from "./AppFooter";
import NoteForm from "./NoteForm";
import NoteList from "./NoteList";
import { createNote, fetchNotes, type Note } from "../api/notes";

const SUBTITLE = "A minimal task-notes app for keeping track of what needs doing.";
const LOAD_ERROR_MESSAGE = "Saved notes could not be loaded.";

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

const mainStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.25rem",
  width: "100%",
  maxWidth: "32rem",
};

const loadErrorStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.875rem",
  color: "#b3261e",
};

function LandingPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchNotes()
      .then((loadedNotes) => {
        if (isActive) {
          setNotes(loadedNotes);
        }
      })
      .catch(() => {
        if (isActive) {
          setLoadErrorMessage(LOAD_ERROR_MESSAGE);
        }
      });

    // Guards against a state update after unmount when the request is still in flight.
    return () => {
      isActive = false;
    };
  }, []);

  async function handleCreateNote(content: string) {
    const createdNote = await createNote(content);
    setNotes((currentNotes) => [...currentNotes, createdNote]);
  }

  return (
    <div data-testid="landing-page" style={containerStyle}>
      <header>
        <h1 data-testid="landing-title" style={titleStyle}>
          Task Notes
        </h1>
      </header>
      <main style={mainStyle}>
        <p style={subtitleStyle}>{SUBTITLE}</p>
        <NoteForm onSubmit={handleCreateNote} />
        {loadErrorMessage !== null && (
          <p data-testid="notes-load-error" role="alert" style={loadErrorStyle}>
            {loadErrorMessage}
          </p>
        )}
        <NoteList notes={notes} />
      </main>
      <AppFooter />
    </div>
  );
}

export default LandingPage;
