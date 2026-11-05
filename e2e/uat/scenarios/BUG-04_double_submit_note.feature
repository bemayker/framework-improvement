Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double submit of a note to be saved only once
  So that my note list does not fill up with accidental duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double click on Save note stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" while the first save is still pending
    Then exactly one save request is sent to the backend
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And after I reload "http://localhost:5183" the note is still shown exactly once

  Scenario: The form accepts the next note once a save has finished
    Given I just saved the note "First note"
    And the save button identified by "note-submit" is enabled again
    When I type "Second note" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "Second note" is shown in the notes list identified by "note-list"
    And "First note" is still shown exactly once

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    When I type "Enter check" into the note field identified by "note-input"
    And I press Enter twice in quick succession while the first save is still pending
    Then exactly one save request is sent to the backend
    And "Enter check" is shown exactly once in the notes list identified by "note-list"
