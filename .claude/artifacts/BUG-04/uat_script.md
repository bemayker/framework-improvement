# UAT Script, BUG-04: Saving a note twice quickly stores it twice

Tester: ____________  Date: ____________  Result: PASS / FAIL

## Criterion 1: A second submit while the first save is in progress stores the note only once
Prerequisites: the stack is running (`docker compose up`), the frontend is open at `http://localhost:5183/`, and the browser devtools Network tab is open with throttling set to `Slow 3G` so the save stays in flight long enough to click again.
1. On the landing page, type `Double click check` in the `New note` field → the text is in the field.
2. Double-click `Save note` quickly → while the request is pending the `Save note` button is greyed out and does not respond; the Network tab shows exactly one `POST /api/notes`.
3. Wait for the request to finish → `Double click check` appears exactly once in the list and the field is empty.
4. Set throttling back to `No throttling` and reload the page → `Double click check` appears exactly once in the list.
5. Repeat steps 1 to 3 with `Enter twice check`, pressing `Enter` twice quickly in the field instead of clicking → one `POST /api/notes`, and `Enter twice check` appears once.
6. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`, including "submits only once while a save is in progress".

## Criterion 2: Once the save has finished, the form accepts the next submit
Prerequisites: as for criterion 1, throttling `No throttling`.
1. On the landing page, type `First note` and click `Save note` → `First note` appears in the list and the `Save note` button is enabled again.
2. Type `Second note` and click `Save note` → `Second note` appears below `First note`; two notes were saved by two clicks.
3. Stop the backend (`docker compose stop backend`), type `Retry note` and click `Save note` → the message "The note could not be saved. Please try again." appears, the field still holds `Retry note`, and the `Save note` button is enabled.
4. Start the backend (`docker compose start backend`) and click `Save note` once → `Retry note` appears once in the list and the error message is gone.
5. Automated check: run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` → `0 failed`, including the enabled-after-success and retry-after-failure cases.
