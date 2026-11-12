---
id: BUG-08
type: bug
title: A slow initial notes load can overwrite a note saved in the meantime
severity: low
status: todo
---

## Description

`LandingPage` loads the list once on mount (`frontend/src/components/LandingPage.tsx:40-60`) and, when the request resolves, replaces the whole list with `setNotes(savedNotes)` (line 46). The form is usable while that request is in flight, and `onCreated` appends with `setNotes((current) => [...current, note])` (line 74). If a note is saved first and the initial `GET /api/notes` resolves afterwards, the `GET` result (taken before, or without, the new note) replaces the state and the note the user just saved disappears from the list until reload. The backend still stores it.

The `isMounted` flag only guards against unmount, not against this ordering.

## Evidence

```tsx
listNotes().then((savedNotes) => {
  if (isMounted) {
    setNotes(savedNotes); // replaces, rather than merges with, notes added since mount
  }
})
...
onCreated={(note) => setNotes((current) => [...current, note])}
```

## Acceptance criteria

- [ ] A note saved while the initial load is still pending stays in the list after the load resolves.
- [ ] After the initial load resolves with no concurrent save, the list shows exactly the notes the backend returned, oldest first.
- [ ] A Vitest test holds `listNotes` pending, submits a note, then resolves the load and asserts the saved note is still listed.

Fix direction: merge the loaded notes with the current state by `id` instead of replacing it, or keep the form disabled until the initial load settles.
