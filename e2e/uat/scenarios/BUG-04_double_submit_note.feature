Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick repeat click or Enter on "Save note" to save my note only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Activating "Save note" twice in quick succession stores the note once (AC1)
    Given the landing page is open
    And saving a note is slow enough for a second click to land while the first save is still pending
    When I type a new unique note into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then the save button is disabled while the save is pending
    And exactly one save request for the note is sent to the backend
    And the note is shown exactly once in the notes list identified by "note-list"
    And after I reload the page the note is still shown exactly once

  Scenario: The form accepts the next note once the save has settled (AC2, success)
    Given I just saved the note "First note A" and it is listed
    When I type "Second note B" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the save button was enabled again before I typed the second note
    And "First note A" and "Second note B" are each shown exactly once in the notes list identified by "note-list"

  Scenario: A failed save releases the button and keeps the text for a retry (AC2, failure)
    Given the backend is not reachable
    When I type "Retry note C" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And "Retry note C" is still in the note field
    And the save button identified by "note-submit" is enabled again
    When the backend is reachable again and I press the save button
    Then "Retry note C" is shown exactly once in the notes list identified by "note-list"
    And the error message is gone

  Scenario: Pressing Enter twice in a row stores the note once (edge case)
    Given the landing page is open
    And saving a note is slow enough for a second Enter to land while the first save is still pending
    When I type a new unique note into the note field identified by "note-input"
    And I press Enter twice quickly
    Then exactly one save request for the note is sent to the backend
    And the note is shown exactly once in the notes list identified by "note-list"
