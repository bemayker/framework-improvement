Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double submit of the note form to save my note only once
  So that my notes list never shows accidental duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-click on "Save note" stores the note once
    Given the landing page is open
    When I type a unique note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one POST request to "/api/notes" was sent
    And the note is shown exactly once in the notes list identified by "note-list"
    And after I reload the page the note is still shown exactly once

  Scenario: The save button is disabled while a save is in flight and enabled again afterwards
    Given the landing page is open
    And the backend answers "POST /api/notes" slowly
    When I type a note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the save button identified by "note-submit" is disabled while the request is pending
    And pressing it again sends no second request
    And once the save finishes the save button is enabled again

  Scenario: A failed save re-enables the button so it can be retried (edge case)
    Given the landing page is open
    And the backend is unreachable
    When I type a note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And the text stays in the note field
    And the save button identified by "note-submit" is enabled
    When the backend is reachable again and I press the save button once more
    Then the note is saved once and shown in the notes list identified by "note-list"

  Scenario: A second distinct note saves normally after a double-clicked save (edge case)
    Given I double-clicked "Save note" for a first unique note and it was listed once
    When I type a second unique note into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then both notes are shown in the notes list identified by "note-list", each exactly once
