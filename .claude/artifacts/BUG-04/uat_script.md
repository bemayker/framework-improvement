# UAT Script: BUG-04 Saving a note twice quickly stores it once

Note for the tester: the tracker item has no description, only the title "Saving a note twice quickly stores it twice". The three acceptance criteria below were derived from that title by the planner and recorded as a scope change in the plan. They are assumptions, not authored requirements: if the intended behaviour differs (for example the product owner wants server-side deduplication), say so in the Notes field.

## Prerequisites

- Repository checked out on branch `feature/BUG-04-double-submit-note`.
- Docker and a browser with dev tools available.
- Network tab open in the dev tools, filtered on `notes`. Throttling "Slow 4G" makes the second click land while the first save is pending (criterion 1); use "No throttling" for criteria 2 and 3.

## Test Environment Setup

1. From the repository root, start the stack:
   ```bash
   docker compose up --build
   ```
2. Wait until `http://localhost:5183` loads the "Task Notes" page.

## Steps

### Criterion 1 (derived): Two quick clicks on Save note send one POST and store the note once

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183` | The "Task Notes" title, the note field and the **Save note** button are shown; note how many entries the list holds | [ ] Pass [ ] Fail |
| 2 | Type `BUG-04 double click 1` in the **New note** field | The text is in the field | [ ] Pass [ ] Fail |
| 3 | Double click **Save note** quickly | The button turns greyed out (disabled) while the request is pending; the Network tab shows exactly one `POST /api/notes`, answered 201 | [ ] Pass [ ] Fail |
| 4 | Read the list | `BUG-04 double click 1` appears exactly once at the bottom; the field is empty again | [ ] Pass [ ] Fail |
| 5 | Reload the page (F5) | After `GET /api/notes` completes, `BUG-04 double click 1` is still listed exactly once | [ ] Pass [ ] Fail |
| 6 | Type `BUG-04 enter twice` in the field, then press Enter twice quickly (edge case) | The Network tab shows exactly one `POST /api/notes`, and the note appears once | [ ] Pass [ ] Fail |

### Criterion 2 (derived): After a save finishes, Save note is usable again

Set throttling back to "No throttling".

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Type `BUG-04 next note` and click **Save note** once | The note appears and the button is enabled again (not greyed out) | [ ] Pass [ ] Fail |
| 8 | Type `BUG-04 after that` and click **Save note** once | A second `POST /api/notes` is sent and the note appears below the previous one | [ ] Pass [ ] Fail |
| 9 | In a terminal run `docker compose stop backend`, type `BUG-04 offline`, click **Save note** | The message "The note could not be saved. Please try again." appears, the text stays in the field, and the button is enabled again | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait until it answers, then click **Save note** again | The error disappears and `BUG-04 offline` is added to the list | [ ] Pass [ ] Fail |

### Criterion 3 (derived): A deliberate second save of the same text stores a second note

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Type `BUG-04 same text` and click **Save note** once | It appears in the list | [ ] Pass [ ] Fail |
| 12 | Wait until the button is enabled again, type `BUG-04 same text` again and click **Save note** once | The Network tab shows a second `POST /api/notes`, and the list now shows `BUG-04 same text` twice | [ ] Pass [ ] Fail |

### Automated check

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | From the repository root run `npm --prefix frontend test -- src/components/NoteForm.test.tsx` | No failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 14 | With the stack running, from the repository root run `npx playwright test e2e/tests/BUG-04_double_submit_note.spec.ts` | No failed test on the summary line, exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
