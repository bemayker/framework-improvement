Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a double-click on "Save note" to save my note only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double-clicking Save note stores and lists the note once
    Given the landing page is open
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then "BUG-04 double click check" is shown exactly once in the notes list identified by "note-list"
    And exactly one "POST /api/notes" request was sent
    And after I reload the page "BUG-04 double click check" is still listed exactly once

  Scenario: A different note can be saved after a save has finished
    Given I just saved the note "BUG-04 double click check"
    When I type "BUG-04 second note" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then both "BUG-04 double click check" and "BUG-04 second note" are listed exactly once each

  Scenario: A failed save can be retried (edge case)
    Given the backend is stopped
    And I typed "BUG-04 retry note" into the note field identified by "note-input"
    When I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still holds "BUG-04 retry note"
    And the save button is enabled
    When the backend is started again and I click the save button once more
    Then the message disappears and "BUG-04 retry note" is listed exactly once
