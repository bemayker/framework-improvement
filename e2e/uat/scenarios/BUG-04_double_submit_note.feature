Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a rapid second submit of the note form to be ignored while the first save is still pending
  So that one note I meant to save is stored and listed exactly once

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"
    And a save takes long enough that a second submit can happen before the first save has answered

  Scenario: A double click on "Save note" stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" before the first save has answered
    Then the save button identified by "note-submit" is disabled while the save is pending
    And exactly one "POST /api/notes" request is sent
    And "Double click check 1" is shown once in the notes list identified by "note-list"
    And after I reload the page "Double click check 1" is still shown once

  Scenario: A click followed by Enter stores the note once (edge case)
    Given the landing page is open
    When I type "Click then Enter check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    And I press Enter in the note field before the first save has answered
    Then exactly one "POST /api/notes" request is sent
    And "Click then Enter check" is shown once in the notes list identified by "note-list"

  Scenario: The form accepts the next submit once a save has finished
    Given I saved the note "Buy milk" and the save has finished
    And the save button identified by "note-submit" is enabled again and the note field is empty
    When I type "Buy milk" into the note field identified by "note-input" again
    And I click the save button identified by "note-submit"
    Then a second "POST /api/notes" request is sent
    And "Buy milk" is shown twice in the notes list identified by "note-list"

  Scenario: A save that failed can be retried from the same form
    Given the backend is not reachable
    When I type "Retry me" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still reads "Retry me"
    And the save button identified by "note-submit" is enabled
    When the backend is reachable again
    And I click the save button identified by "note-submit"
    Then the error message disappears
    And "Retry me" is shown once in the notes list identified by "note-list"
