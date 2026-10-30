Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double submission of my note to be saved only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-click on Save note stores the note once
    Given the landing page is open
    When I type a note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one create request is sent to "/api/notes"
    And the note appears once in the notes list identified by "note-list"
    And the note field is empty again
    And after I reload the page the note still appears exactly once

  Scenario: The save button is disabled while a save is in flight
    Given the landing page is open
    And the network is slow enough that a save takes a few seconds
    When I type a note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the save button identified by "note-submit" is disabled until the note appears
    And clicking the save button again while it is disabled sends no further request
    And once the note appears the save button is enabled again

  Scenario: The form accepts a new note after a save has finished
    Given I saved a note and it appears in the notes list identified by "note-list"
    When I type another note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the second note also appears in the notes list
    And the note field is empty again

  Scenario: A failed save keeps my text and lets me retry
    Given the landing page is open
    And the backend cannot be reached
    When I type a note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the error message "The note could not be saved. Please try again."
    And the note field still holds the text I typed
    And the save button identified by "note-submit" is enabled
    And when the backend is reachable again and I press the save button, the note appears once in the list and the error message is gone

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    When I type a note into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one create request is sent to "/api/notes"
    And the note appears once in the notes list identified by "note-list"
