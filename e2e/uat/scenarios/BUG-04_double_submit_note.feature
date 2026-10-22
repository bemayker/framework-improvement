Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second click on "Save note" not to create a duplicate
  So that each note I write is stored and listed exactly once

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Clicking Save note twice quickly stores the note once
    Given the landing page is open and the save request is slow
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one "POST /api/notes" request is sent
    And "BUG-04 double click check" appears once in the notes list identified by "note-list"
    And after reloading the page it is still listed exactly once

  Scenario: The save button is disabled while a save is in flight
    Given the landing page is open and the save request is slow
    When I type "BUG-04 disabled check" and click the save button identified by "note-submit" once
    Then the save button is disabled until the save finishes
    And once the save finishes the save button is enabled again
    And "BUG-04 disabled check" is listed once

  Scenario: A failed save can be retried and TEST-03 behaviour is unchanged
    Given the backend is unavailable
    When I type "BUG-04 retry check" and click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again." identified by "note-form-error"
    And the note field still holds "BUG-04 retry check"
    And the save button is enabled
    When the backend is available again and I click the save button
    Then "BUG-04 retry check" appears once in the notes list
    And the error message is gone

  Scenario: An empty or whitespace-only note is still refused without an API call (edge case)
    Given the landing page is open
    When I click the save button with an empty note field, and then with three spaces typed
    Then each time I see the validation message "Enter a note before saving."
    And no "POST /api/notes" request is sent
