Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double save to store my note only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes app (frontend, backend, database) is running
    And the application is open at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double-clicking Save note sends one request and stores the note once
    Given the landing page is open
    And the network is slow, so the first save is still pending when I click again
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request to "/api/notes" is sent
    And "Double click check 1" is shown once in the notes list identified by "note-list"
    And after I reload the page, "Double click check 1" is still shown exactly once

  Scenario: Pressing Enter twice while the first save is pending stores the note once
    Given the landing page is open
    And the network is slow, so the first save is still pending when I press Enter again
    When I type "Enter twice check" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one save request to "/api/notes" is sent
    And "Enter twice check" is shown once in the notes list identified by "note-list"

  Scenario: The save button is disabled while a save is pending and enabled after success
    Given the landing page is open
    And the network is slow
    When I type "Pending state check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled while the request is pending
    And pressing it again sends no further request
    And once the save finishes "Pending state check" is shown in the notes list
    And the note field is empty and the save button is enabled again

  Scenario: The save button is enabled again after a failed save so I can retry
    Given the landing page is open
    And the network is offline
    When I type "Offline check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see an error message that the note could not be saved
    And "Offline check" stays in the note field
    And the save button is enabled again
    When the network is back and I press the save button again
    Then the error message disappears
    And "Offline check" is shown once in the notes list identified by "note-list"

  Scenario: Saving the same text again after the first save finished stores a second note (edge case)
    Given I saved the note "Repeat text check" and the save has finished
    When I type "Repeat text check" into the note field identified by "note-input" again
    And I press the save button identified by "note-submit"
    Then "Repeat text check" is shown twice in the notes list identified by "note-list"
    And only simultaneous submits are ignored, deliberate repeat saves are kept
