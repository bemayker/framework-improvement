import { useEffect, useState, type CSSProperties } from "react";
import AppFooter from "./AppFooter";
import NoteForm from "./NoteForm";
import NoteList from "./NoteList";
import { listNotes, type Note } from "../api/notes";

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
  width: "100%",
  maxWidth: "32rem",
};

function LandingPage() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    let isMounted = true;

    listNotes()
      .then((savedNotes) => {
        if (isMounted) {
          setNotes(savedNotes);
        }
      })
      .catch(() => {
        // A failed initial load leaves the list empty rather than blocking the
        // page: the next submit surfaces the real error through the form.
        if (isMounted) {
          setNotes([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div data-testid="landing-page" style={containerStyle}>
      <header>
        <h1 data-testid="landing-title" style={titleStyle}>
          Task Notes
        </h1>
      </header>
      <main style={mainStyle}>
        <p style={subtitleStyle}>
          A minimal task-notes app for keeping track of what needs doing.
        </p>
        <NoteForm
          onCreated={(note) => setNotes((current) => [...current, note])}
        />
        <NoteList notes={notes} />
      </main>
      <AppFooter />
    </div>
  );
}

export default LandingPage;
