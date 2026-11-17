Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I submit twice in quick succession to be saved only once
  So that my note list does not fill up with duplicates

  Background:
    Given the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double click on Save note stores the note once
    Given the backend answers slowly
    And the landing page is open
    When I type a unique note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And the note is shown exactly once in the notes list identified by "note-list"
    And the note is still shown exactly once after I reload the page

  Scenario: Pressing Enter twice quickly stores the note once
    Given the backend answers slowly
    And the landing page is open
    When I type a unique note into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one save request is sent to the backend
    And the note is shown exactly once in the notes list identified by "note-list"

  Scenario: The save button is disabled while a save is in flight
    Given the backend answers slowly
    And the landing page is open
    When I type a note into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled and looks dimmed until the note appears in the list
    And the save button is enabled again after the note has appeared

  Scenario: A failed save can be retried (edge case)
    Given the backend cannot be reached
    And the landing page is open
    When I type a note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see a message saying the note could not be saved
    And the text is still in the note field
    And the save button is enabled again
    When the backend is reachable again and I press the save button
    Then the note is shown exactly once in the notes list identified by "note-list"
    And the error message is gone
