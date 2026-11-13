Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I save twice in quick succession to be stored once
  So that my list does not fill up with duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A second submit while the first save is in flight stores the note once
    Given the landing page is open
    And saving a note is slowed so that a save stays in flight
    When I type "Double click check 1" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" twice in quick succession
    Then only one save request is sent to the backend
    And the save button identified by "note-submit" is greyed out and cannot be pressed while the save is in flight
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And "Double click check 1" is still listed exactly once after I reload the page

  Scenario: Pressing Enter twice stores the note once
    Given the landing page is open
    And saving a note is slowed so that a save stays in flight
    When I type "Enter key check 1" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then only one save request is sent to the backend
    And "Enter key check 1" is shown exactly once in the notes list identified by "note-list"

  Scenario: The form accepts the next note once the save has finished
    Given the landing page is open
    And I just saved the note "First after fix"
    When I type "Second after fix" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "Second after fix" is added to the notes list identified by "note-list" below "First after fix"
    And the save button identified by "note-submit" is enabled again

  Scenario: The same note can be retried after a failed save (edge case)
    Given the landing page is open
    And the backend cannot be reached
    When I type "Retry after failure" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still contains "Retry after failure"
    And the save button identified by "note-submit" is enabled again
    When the backend can be reached again
    And I press the save button identified by "note-submit"
    Then the message disappears
    And "Retry after failure" is shown exactly once in the notes list identified by "note-list"
    And the note field is empty
