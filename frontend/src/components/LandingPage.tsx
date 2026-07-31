import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import AppFooter from "./AppFooter";
import NoteForm from "./NoteForm";
import NoteList from "./NoteList";
import { createNote, listNotes } from "../api/notes";
import type { Note } from "../api/notes";

const NOTES_HEADING_TEXT = "Notes";
const LOAD_ERROR_MESSAGE = "Your notes could not be loaded.";
const SAVE_ERROR_MESSAGE = "Your note could not be saved.";

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
};

const notesHeadingStyle: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  margin: 0,
  textAlign: "left",
};

const notesErrorStyle: CSSProperties = {
  fontSize: "0.875rem",
  color: "#b3261e",
  margin: 0,
  textAlign: "left",
};

function LandingPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listNotes()
      .then((loaded) => {
        if (active) {
          setNotes(loaded);
          setNotesError(null);
        }
      })
      .catch(() => {
        if (active) {
          setNotesError(LOAD_ERROR_MESSAGE);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateNote = useCallback(async (text: string) => {
    try {
      const created = await createNote(text);
      setNotes((current) => [...current, created]);
      setNotesError(null);
    } catch (cause) {
      setNotesError(SAVE_ERROR_MESSAGE);
      // Rethrow so the form keeps the text the user typed instead of clearing it.
      throw cause;
    }
  }, []);

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
        <section data-testid="notes-section" style={notesSectionStyle} aria-labelledby="notes-heading">
          <h2 id="notes-heading" style={notesHeadingStyle}>
            {NOTES_HEADING_TEXT}
          </h2>
          <NoteForm onSubmit={handleCreateNote} />
          {notesError !== null && (
            <p data-testid="notes-error" role="alert" style={notesErrorStyle}>
              {notesError}
            </p>
          )}
          <NoteList notes={notes} />
        </section>
      </main>
      <AppFooter />
    </div>
  );
}

export default LandingPage;
