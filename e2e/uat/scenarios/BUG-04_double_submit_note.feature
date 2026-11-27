Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a double submit while a save is in flight to be ignored
  So that my note is stored exactly once

  Background:
    Given the Task Notes app is open at the landing page
    And saving a note takes a few seconds

  Scenario: A double click on "Save note" stores the note once (criterion 1)
    When I type "Double click check 1" in the "New note" field
    And I double-click "Save note"
    Then exactly one POST request is sent to "/api/notes"
    And "Double click check 1" appears once in the list
    And after a reload "Double click check 1" is listed exactly once

  Scenario: "Save note" is disabled while a save is in flight (criterion 2)
    When I type "Disabled check 1" in the "New note" field
    And I click "Save note"
    Then "Save note" is disabled until the request finishes
    And clicking it again sends no second request

  Scenario: "Save note" is enabled again after a successful save (criterion 3)
    When I type "Reenable check 1" in the "New note" field
    And I click "Save note"
    And the request finishes
    Then the note is listed, the field is empty and "Save note" is enabled

  Scenario: "Save note" is enabled again after a failed save (criterion 3)
    Given the backend is unavailable
    When I type "Reenable check 3" in the "New note" field
    And I click "Save note"
    Then the error "The note could not be saved. Please try again." is shown
    And "Reenable check 3" is still in the field
    And "Save note" is enabled

  Scenario: Clicking and then pressing Enter stores the note once (edge case)
    When I type "Enter key check 1" in the "New note" field
    And I click "Save note"
    And I immediately press Enter in the field
    Then exactly one POST request is sent to "/api/notes"
    And "Enter key check 1" is listed once
