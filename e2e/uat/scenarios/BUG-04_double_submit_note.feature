Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I save with a fast double-click to be stored only once
  So that my notes list never fills up with accidental duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-clicked note is stored exactly once
    Given the landing page is open
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one request to create a note is sent to the backend
    And "BUG-04 double click check" is shown once in the notes list identified by "note-list"
    And after I reload "http://localhost:5183" it is still shown once in the notes list

  Scenario: The save button is disabled while a save is in flight and enabled again afterwards
    Given the landing page is open
    And the connection is slow, so a save takes a few seconds
    When I type "BUG-04 slow save" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled until the note appears in the notes list
    And pressing the disabled save button again sends no second request
    And once the note is listed the save button is enabled again
    And I can save another note afterwards

  Scenario: A failed save re-enables the button so the note can be retried (edge case)
    Given the landing page is open
    And the connection is offline
    When I type "BUG-04 offline save" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text "BUG-04 offline save" is still in the note field
    And the save button is enabled again
    And when the connection is back and I press the save button again, the note is saved once
