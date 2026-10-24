Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second click on "Save note" to be ignored
  So that each note I write is stored exactly once

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A quick double click on Save note stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" as fast as I can
    Then exactly one request to store the note is sent
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And the note field is empty
    And when I reload the page, "Double click check 1" is still shown exactly once

  Scenario: Further submits are ignored while a save is in progress
    Given the landing page is open
    And I typed "Slow save check" into the note field identified by "note-input"
    And I pressed the save button identified by "note-submit" and the save has not finished yet
    Then the save button identified by "note-submit" is disabled
    When I click the save button again
    And I press Enter in the note field
    Then no further request to store a note is sent
    And once the save finishes, "Slow save check" is shown exactly once in the notes list

  Scenario: The form accepts a new note after a successful save
    Given I saved the note "After success check" and the save has finished
    Then the note field identified by "note-input" is empty
    And the save button identified by "note-submit" is enabled
    When I type "Second note" and press the save button
    Then "Second note" is shown in the notes list identified by "note-list"

  Scenario: The form can be retried after a failed save
    Given the backend is not reachable
    When I type "After failure check" and press the save button identified by "note-submit"
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And the note field identified by "note-input" still holds "After failure check"
    And the save button identified by "note-submit" is enabled
    When the backend is reachable again and I press the save button
    Then "After failure check" is shown exactly once in the notes list
    And the message identified by "note-form-error" is gone

  Scenario: Pressing Enter twice in the field stores the note once (edge case)
    Given the landing page is open
    When I type "Enter twice check" into the note field identified by "note-input"
    And I press Enter twice in the note field while the first save has not finished
    Then exactly one request to store the note is sent
    And "Enter twice check" is shown exactly once in the notes list identified by "note-list"
