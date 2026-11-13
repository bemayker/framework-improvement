Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double click on the save button to save my note only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes application is running with its frontend at "http://localhost:5183" and its backend at "http://localhost:8010"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-clicked note is stored and listed once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double click the save button identified by "note-submit"
    Then exactly one save request was sent to the backend
    And "Double click check 1" is shown once in the notes list identified by "note-list"
    And after I reload the page, "Double click check 1" is still shown exactly once

  Scenario: The form accepts the next note after a save has finished
    Given I saved the note "First after fix"
    When I type "Second after fix" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "Second after fix" is shown in the notes list identified by "note-list"
    And the save button is enabled again

  Scenario: A failed save can be retried with the kept text (edge case)
    Given the backend is unreachable
    When I type "Retry after failure" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And the note field still holds "Retry after failure"
    When the backend is reachable again
    And I press the save button identified by "note-submit" without retyping
    Then "Retry after failure" is shown once in the notes list identified by "note-list"

  Scenario: A different note saved after a double-clicked one is also stored once (edge case)
    Given I double clicked the save button for the note "Double click check 3"
    When I save a different note "Double click check 4"
    Then both notes are shown exactly once each in the notes list identified by "note-list"
    And two save requests in total were sent to the backend
