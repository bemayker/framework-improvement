Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double submit of the note form to save the note once
  So that my note list never holds accidental duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note field identified by "note-input", the save button identified by "note-submit" and the notes list identified by "note-list"

  Scenario: Double-clicking Save stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one "POST /api/notes" request was sent
    And "Double click check 1" is shown once in the notes list identified by "note-list"
    And when I reload the page, "Double click check 1" is still shown exactly once

  Scenario: The save button is disabled while a save is in progress
    Given the landing page is open
    And the network is slow enough that a save stays in flight
    When I type "Slow save check" into the note field and press the save button once
    Then the save button identified by "note-submit" is disabled until the save finishes
    And pressing Enter in the note field or clicking the button again sends no second request
    And "Slow save check" is shown once in the notes list when the save finishes

  Scenario: The save button works again after a save finishes
    Given the landing page is open
    When I save the note "First after fix"
    Then the save button identified by "note-submit" is enabled again
    And I can save the note "Second after fix" and it is listed below the first one
    When the backend is unreachable and I try to save the note "Retry me"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still reads "Retry me" and the save button is enabled
    When the backend is reachable again and I press the save button
    Then "Retry me" is shown once in the notes list and the error message is gone

  Scenario: Pressing Enter twice in the field stores the note once (edge case)
    Given the landing page is open
    When I type "Enter twice check" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one "POST /api/notes" request was sent
    And "Enter twice check" is shown once in the notes list identified by "note-list"
