Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second click on "Save note" to be ignored while the first save is running
  So that one note I wrote is stored and listed once

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double submit stores one note
    Given the landing page is open
    And the save of a new note is slow to answer
    When I type "Buy milk" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one request to create a note is sent to the backend
    And "Buy milk" is shown exactly once in the notes list identified by "note-list"
    And "Buy milk" is still shown exactly once after I reload the page

  Scenario: The save button is unavailable while saving and usable again afterwards
    Given the landing page is open
    And the save of a new note is slow to answer
    When I type "Buy milk" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button identified by "note-submit" is disabled while the save is running
    And once "Buy milk" appears in the notes list the save button is enabled again
    And saving "Buy milk" a second time on purpose adds a second entry to the notes list

  Scenario: A failed save leaves the button usable for a retry
    Given the landing page is open
    And the backend cannot be reached
    When I type "Buy milk" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text "Buy milk" stays in the note field
    And the save button identified by "note-submit" is enabled again
    And once the backend can be reached again, pressing the save button adds "Buy milk" to the notes list once

  Scenario: A click followed by Enter stores one note (edge case)
    Given the landing page is open
    And the save of a new note is slow to answer
    When I type "Buy milk" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    And I press Enter in the note field before the save has answered
    Then exactly one request to create a note is sent to the backend
    And "Buy milk" is shown exactly once in the notes list identified by "note-list"
