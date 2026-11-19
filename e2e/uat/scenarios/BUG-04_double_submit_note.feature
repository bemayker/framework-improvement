Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of Task Notes
  I want a quick double-click on "Save note" to save my note only once
  So that my list does not fill with duplicates

  Background:
    Given the Task Notes app is running at "http://localhost:5183"
    And I have opened the landing page

  Scenario: Double-clicking Save note stores the note exactly once
    When I type "Double click check 1" in the "New note" field
    And I double-click "Save note" quickly
    Then exactly one "POST /api/notes" request is sent
    And "Double click check 1" appears once in the note list
    And after I reload the page "Double click check 1" appears once in the note list

  Scenario: Save note is disabled and ignores further submits while a save is in flight
    Given a save of "In flight check" is still in flight
    When I look at the "Save note" button
    Then the button is disabled
    When I click "Save note" again and press Enter in the "New note" field
    Then no second "POST /api/notes" request is sent
    And "In flight check" appears once in the note list when the save finishes

  Scenario: Save note is enabled again after the save finishes
    Given I have just saved "First after fix"
    Then the "Save note" button is enabled
    When I type "Second after fix" in the "New note" field
    And I click "Save note"
    Then "Second after fix" appears in the note list

  Scenario: Save note is enabled again after a failed save (edge case)
    Given the backend is unavailable
    When I type "Fails to save" in the "New note" field
    And I click "Save note"
    Then I see "The note could not be saved. Please try again."
    And "Fails to save" is still in the "New note" field
    And the "Save note" button is enabled

  Scenario: A second distinct note can be saved after the first completes (edge case)
    Given I have just saved "First distinct note"
    When I save "Second distinct note"
    Then both notes appear once each in the note list
