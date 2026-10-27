Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second click or Enter press while a note is saving to be ignored
  So that each note I write is stored and listed once

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A second submit while the first save is in flight stores the note once
    Given the landing page is open
    And the save request is slowed so it stays in flight for a few seconds
    When I type "Double click check 1" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" twice in quick succession
    Then only one save request is sent to the backend
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And "Double click check 1" is still listed exactly once after I reload the page

  Scenario: The save button is disabled while saving and enabled after success
    Given the landing page is open
    And the save request is slowed so it stays in flight for a few seconds
    When I type "Disabled check 2" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled and looks dimmed while the request is pending
    And when the save completes the save button is enabled again
    And "Disabled check 2" is shown in the notes list identified by "note-list"

  Scenario: After a failed save the form is usable again
    Given the landing page is open
    And the backend is stopped
    When I type "Retry check 3" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the save error message identified by "note-form-error"
    And the note field still holds "Retry check 3"
    And the save button is enabled
    And when the backend is running again and I press the save button, a new save request is sent
    And "Retry check 3" is shown exactly once in the notes list identified by "note-list"

  Scenario: Pressing Enter twice while saving stores the note once (edge case)
    Given the landing page is open
    And the save request is slowed so it stays in flight for a few seconds
    When I type "Enter check 1" into the note field identified by "note-input"
    And I press Enter twice in quick succession in the note field
    Then only one save request is sent to the backend
    And "Enter check 1" is shown exactly once in the notes list identified by "note-list"
