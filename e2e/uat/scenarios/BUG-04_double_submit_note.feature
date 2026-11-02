Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double click on "Save note" to store my note only once
  So that my list never shows accidental duplicates

  Background:
    Given the Task Notes application (frontend, backend, database) is running
    And the application is open at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A quick double click stores exactly one note
    Given the landing page is open
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" as fast as I can
    Then the note field is empty again
    And "BUG-04 double click check" is shown exactly once in the notes list identified by "note-list"
    And after I reload the page "BUG-04 double click check" is still shown exactly once
    And only one "POST /api/notes" request was sent

  Scenario: The save button is disabled while saving and enabled again after success
    Given the landing page is open
    And the network is slow enough to keep a save visibly in progress
    When I type "BUG-04 slow save" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then the save button is disabled and clicking it again does nothing
    When the save finishes
    Then "BUG-04 slow save" is shown once in the notes list
    And the save button is enabled again
    And I can save a further note "BUG-04 second note", which is shown once below the first

  Scenario: After a failed save the button is enabled and a retry stores exactly one note
    Given the landing page is open
    And the backend is stopped
    When I type "BUG-04 retry check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text "BUG-04 retry check" stays in the note field
    And the save button is enabled
    When the backend is running again
    And I click the save button once
    Then the message disappears
    And "BUG-04 retry check" is shown exactly once in the notes list

  Scenario: Two deliberate saves of the same text store two notes (edge case)
    Given the landing page is open
    When I type "BUG-04 same text" into the note field and click the save button identified by "note-submit"
    And I wait until "BUG-04 same text" appears in the notes list
    And I type "BUG-04 same text" again and click the save button once more
    Then "BUG-04 same text" is shown twice in the notes list
    And after I reload the page it is still shown twice
