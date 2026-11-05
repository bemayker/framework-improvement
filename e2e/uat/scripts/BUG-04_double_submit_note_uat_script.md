# UAT Script, BUG-04: Saving a note twice quickly stores it twice

## Criterion 1: A double-click on "Save note" sends one POST, stores one note, and the list shows it once, also after a reload
Prerequisites: the stack is running (frontend at http://localhost:5183, backend reachable), a desktop browser with developer tools.
1. Open http://localhost:5183/ → the "Task Notes" page shows the "New note" field, the "Save note" button and the current list of notes.
2. Open the browser developer tools, Network tab, filter on `notes` → the initial `GET /api/notes` is listed.
3. Type `BUG-04 double click check` in the "New note" field → the text is in the field.
4. Double-click the "Save note" button quickly → exactly one `POST /api/notes` row appears in the Network tab with status 201, the field clears, and `BUG-04 double click check` appears once at the bottom of the list.
5. Reload the page (F5) → `BUG-04 double click check` is listed exactly once.

## Criterion 2: While a save is in flight the button is disabled and further submits are ignored
Prerequisites: as for criterion 1; in the Network tab set throttling to "Slow 3G" so a save takes a few seconds.
1. Open http://localhost:5183/ and wait for the page to load → the form and list are shown.
2. Type `BUG-04 slow save` in the "New note" field and click "Save note" once → the button turns faded (disabled) and the `POST /api/notes` row shows as pending.
3. While it is pending, click "Save note" three more times → nothing happens; the Network tab still shows a single `POST /api/notes`.
4. While it is still pending, click into the "New note" field and press Enter twice → still a single `POST /api/notes`.
5. Wait for the POST to finish → `BUG-04 slow save` appears once in the list. Set throttling back to "No throttling".

## Criterion 3: Once the save finishes the form accepts a new submit, after a success and after a failure
Prerequisites: as for criterion 1.
1. On http://localhost:5183/, type `BUG-04 first` and click "Save note" → `BUG-04 first` appears in the list, the field clears, the button is not faded.
2. Type `BUG-04 second` and click "Save note" → `BUG-04 second` appears in the list as a separate entry below `BUG-04 first`.
3. Stop the backend (for example `docker compose stop backend` from the repository root, or stop the backend dev server), type `BUG-04 offline` and click "Save note" → the red message "The note could not be saved. Please try again." appears, the field still reads `BUG-04 offline`, and the button is not faded.
4. Start the backend again, click "Save note" → the red message disappears, `BUG-04 offline` appears once in the list, and the field clears.
5. Run `npm --prefix frontend exec --no -- vitest run src/components/NoteForm.test.tsx` from the repository root → the NoteForm tests pass with `0 failed`.
