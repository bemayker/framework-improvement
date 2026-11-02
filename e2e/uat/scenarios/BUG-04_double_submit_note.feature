Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I save twice in quick succession to be stored once
  So that my notes list does not fill up with accidental duplicates

  Background:
    Given the Task Notes application (frontend, backend, database) is running
    And the application is open at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double-clicking save stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" as fast as I can
    Then "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And after I reload the page, "Double click check 1" is still shown exactly once

  Scenario: The save button is disabled while a save is in progress
    Given the landing page is open
    And my connection is slow enough that a save stays in progress long enough to observe
    When I type "Slow save check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled and looks dimmed while the request is pending
    And pressing the save button again or pressing Enter in the note field sends no second save request
    And after the save finishes, "Slow save check" is shown exactly once in the notes list

  Scenario: The save button is enabled again after a save completes or fails
    Given the landing page is open
    When I save the note "First after fix"
    Then the save button is enabled again
    And I can save the note "Second after fix", and both notes are shown once
    When the backend is unavailable and I try to save the note "Retry after failure"
    Then I see the message "The note could not be saved. Please try again."
    And the text stays in the note field
    And the save button is enabled again
    When the backend is available again and I press the save button
    Then the message disappears and "Retry after failure" is shown exactly once in the notes list

  Scenario: Pressing Enter right after clicking save stores the note once (edge case)
    Given the landing page is open
    When I type a note into the note field identified by "note-input"
    And I click the save button identified by "note-submit" and immediately press Enter in the note field
    Then the note is shown exactly once in the notes list identified by "note-list"
    And only one save request was sent
