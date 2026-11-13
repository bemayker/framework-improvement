Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick second submit of the note form to be ignored while the first save is running
  So that one note I wrote is stored and listed once

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double submit while the save is running stores one note
    Given the landing page is open
    When I type "Double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then only one save request is sent to the backend
    And "Double click check" is shown once in the notes list identified by "note-list"
    And "Double click check" is still shown exactly once after I reload the page

  Scenario: The save button is disabled while a save is running
    Given the landing page is open
    When I type a note and press the save button identified by "note-submit"
    Then while the save is in progress the save button is disabled
    And once the save has finished the save button is enabled again

  Scenario: After a failed save the note can be saved again
    Given the landing page is open
    And I typed "Retry check" into the note field identified by "note-input"
    When I press the save button identified by "note-submit" while the backend cannot be reached
    Then I see the error message identified by "note-form-error" saying the note could not be saved
    And the note field still contains "Retry check"
    And the save button is enabled
    When the backend is reachable again and I press the save button again
    Then a new save request is sent and "Retry check" is shown once in the notes list identified by "note-list"
    And the note field is empty again

  Scenario: Two deliberate saves of the same text after the first finished store two notes (edge case)
    Given the landing page is open
    When I type "Same text" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" and wait for the save to finish
    And I type "Same text" into the note field again
    And I press the save button identified by "note-submit" and wait for the save to finish
    Then "Same text" is shown twice in the notes list identified by "note-list"
    And this is expected, because the fix only blocks a second submit during a running save and does not detect duplicate text
