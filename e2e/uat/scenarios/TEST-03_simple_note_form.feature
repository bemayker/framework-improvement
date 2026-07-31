Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to write a note and see it saved in a list
  So that I can keep track of what needs doing across visits

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the notes list is empty, so the notes section shows "No notes saved yet." identified by "note-list-empty"
    And I have opened the landing page at "http://localhost:5173"

  Scenario: A non-empty note is saved and appears in the list without a page reload
    Given the notes section identified by "notes-section" is visible
    When I type "Buy milk" into the note input identified by "note-form-input"
    And I press the "Save note" button identified by "note-form-submit"
    Then "Buy milk" appears as an entry in the notes list identified by "note-list"
    And the page did not reload while the note was being saved
    And the note input is cleared, ready for the next note
    And the empty-state text identified by "note-list-empty" is no longer shown

  Scenario: An empty note is rejected with a visible validation message and is never sent
    Given the note input identified by "note-form-input" is empty
    When I press the "Save note" button identified by "note-form-submit"
    Then the validation message "Enter some text before saving a note." is shown in the element identified by "note-form-error"
    And no entry is added to the notes list identified by "note-list"
    And the notes list is still empty after I reload the page, confirming nothing was stored

  Scenario: Saved notes are still there after a page reload
    Given I have saved the note "Buy milk"
    And "Buy milk" is shown in the notes list identified by "note-list"
    When I reload the landing page in the browser
    Then "Buy milk" is still shown in the notes list identified by "note-list"
    And it is the same note rather than a duplicate, so the list holds exactly one entry

  Scenario: A whitespace-only note is treated as empty and rejected (edge case)
    Given the note input identified by "note-form-input" is empty
    When I type three spaces into the note input identified by "note-form-input"
    And I press the "Save note" button identified by "note-form-submit"
    Then the validation message "Enter some text before saving a note." is shown in the element identified by "note-form-error"
    And no entry is added to the notes list identified by "note-list"
    And the three spaces I typed are still in the input, so I can correct them
