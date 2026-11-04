Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of Task Notes
  I want a quick repeated submit of the note form to save the note only once
  So that my list does not fill with duplicates

  Background:
    Given the Task Notes app is running
    And I have opened the landing page

  Scenario: Double-clicking Save note stores exactly one note
    When I type "Double click check 1" in the "New note" field
    And I double-click "Save note"
    Then exactly one POST request to "/api/notes" is sent
    And "Double click check 1" appears once in the note list
    And after I reload the page "Double click check 1" is still listed exactly once

  Scenario: Save note is disabled while a save is in flight
    Given a save of the note "Slow save check" is still in progress
    When I look at "Save note"
    Then the "Save note" button is disabled
    And clicking "Save note" again sends no additional POST request
    And pressing Enter in the "New note" field sends no additional POST request

  Scenario: Save note is enabled again after the save finishes
    Given a save has just finished successfully
    When I type "Second after fix" in the "New note" field
    Then the "Save note" button is enabled
    And clicking "Save note" saves "Second after fix" once

  Scenario: A failed save re-enables the button so a retry stores one note (edge case)
    Given the network is offline
    When I type "Offline retry" in the "New note" field
    And I click "Save note"
    Then the message "The note could not be saved. Please try again." is shown
    And "Offline retry" stays in the "New note" field
    And the "Save note" button is enabled
    When the network is back online
    And I click "Save note"
    Then the error message disappears
    And "Offline retry" appears once in the note list
