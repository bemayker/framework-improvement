Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double submit of the note form to save my note only once
  So that my notes list does not fill up with accidental duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-click on Save note stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" as fast as I can
    Then "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And exactly one POST request to "/api/notes" was sent
    And when I reload the page, "Double click check 1" is still shown exactly once

  Scenario: Pressing Enter twice quickly stores the note once
    Given the landing page is open
    When I type "Enter key check 1" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then "Enter key check 1" is shown exactly once in the notes list identified by "note-list"
    And exactly one POST request to "/api/notes" was sent

  Scenario: The save button is disabled while a save is in flight and enabled afterwards
    Given the landing page is open
    And saving a note takes a noticeable amount of time
    When I type "Slow save check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button identified by "note-submit" is disabled while the request is pending
    And when the save finishes, "Slow save check" is shown once in the notes list
    And the note field is empty and the save button is enabled again

  Scenario: A failed save re-enables the save button so I can retry (edge case)
    Given the landing page is open
    And the browser is offline
    When I type "Offline save check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still holds "Offline save check"
    And the save button identified by "note-submit" is enabled again
    When the browser is back online and I press the save button again
    Then "Offline save check" is shown once in the notes list identified by "note-list"
    And the error message is gone
