Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a rapid second submit to be ignored while my note is being saved
  So that one note is never stored twice

  Background:
    Given the Task Notes stack (frontend, backend, database) is running
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double-clicking Save note while the save is in flight stores one note
    Given the landing page is open
    And saving is slow enough that the first save is still in flight
    When I type "Buy milk BUG-04" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one "POST /api/notes" request is sent
    And the save button is disabled while the save runs
    And "Buy milk BUG-04" is shown once in the notes list identified by "note-list"
    And after I reload the page "Buy milk BUG-04" is still listed exactly once

  Scenario: Pressing Enter twice while the save is in flight stores one note (edge case)
    Given the landing page is open
    And saving is slow enough that the first save is still in flight
    When I type "Walk dog BUG-04" into the note field identified by "note-input"
    And I press Enter twice quickly
    Then exactly one "POST /api/notes" request is sent
    And "Walk dog BUG-04" is shown once in the notes list, also after a reload

  Scenario: The form accepts the next note once the save has finished
    Given I just saved the note "Call Anna BUG-04"
    Then the save button identified by "note-submit" is enabled again
    When I type "Pay rent BUG-04" and press the save button
    Then both "Call Anna BUG-04" and "Pay rent BUG-04" are listed, each once

  Scenario: The same text can be retried after a failed save
    Given the backend is stopped
    And I typed "Water plants BUG-04" and pressed the save button
    Then I see the message "The note could not be saved. Please try again."
    And the note field still holds "Water plants BUG-04"
    And the save button is enabled
    When the backend is running again and I press the save button
    Then "Water plants BUG-04" is shown once in the notes list
    And the note field is empty
