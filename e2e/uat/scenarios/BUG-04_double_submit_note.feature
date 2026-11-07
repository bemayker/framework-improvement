Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I save twice in quick succession to be stored only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double-clicking Save note stores the note once
    Given the landing page is open
    When I type a unique note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then the note is shown exactly once in the notes list identified by "note-list"
    And only one request to store a note was sent to the backend
    And after I reload the page the note is still listed exactly once

  Scenario: Pressing Enter twice quickly stores the note once
    Given the landing page is open
    When I type a unique note into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then the note is shown exactly once in the notes list identified by "note-list"
    And only one request to store a note was sent to the backend
    And after I reload the page the note is still listed exactly once

  Scenario: The save button is disabled while a save is in progress and the form re-opens afterwards
    Given the landing page is open
    And a save is in progress
    Then the save button identified by "note-submit" is disabled
    When the save finishes
    Then the save button identified by "note-submit" is enabled again
    And I can save a second note, which is stored once

  Scenario: A failed save can be retried and the note is stored once (edge case)
    Given the landing page is open
    And the backend is unreachable
    When I type a unique note into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see an error message identified by "note-form-error" and the text stays in the field
    And the save button identified by "note-submit" is enabled again
    When the backend is reachable again
    And I press the save button identified by "note-submit"
    Then the note is shown exactly once in the notes list identified by "note-list"
