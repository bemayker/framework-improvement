Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double submit of the note form to save my note only once
  So that my note list does not fill up with accidental duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double click on save sends only one create request
    Given the landing page is open
    And saving a note takes long enough to click twice
    When I type a new note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then only one save request is sent to the backend
    And the save button identified by "note-submit" is disabled while the save is pending

  Scenario: A note saved with a double click is listed exactly once
    Given the landing page is open
    When I type a new note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then the note is shown exactly once in the notes list identified by "note-list"
    And after I reload the page the note is still shown exactly once

  Scenario: The form accepts the next note once the save has finished
    Given I just saved a note and the save has finished
    When I type another new note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the save button identified by "note-submit" was enabled again before I pressed it
    And the second note is shown in the notes list identified by "note-list"

  Scenario: A failed save re-opens the form so I can try again (edge case)
    Given the landing page is open
    And the backend is unavailable
    When I type a new note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see a message that the note could not be saved
    And the text stays in the note field
    And the save button identified by "note-submit" is enabled again
    When the backend is available again
    And I press the save button identified by "note-submit"
    Then the note is shown in the notes list identified by "note-list"
    And the error message is gone
