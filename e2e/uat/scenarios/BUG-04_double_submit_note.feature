Feature: BUG-04 Saving a note twice quickly stores it once
  A second submit while the first save is still in progress must not store the note again.

  Background:
    Given the stack is running and I am on the landing page at "http://localhost:5183/"

  Scenario: A fast double click on Save note stores the note once (criterion 1)
    Given the network is throttled so a save stays in flight
    When I type "Double click check" in the "New note" field
    And I double-click "Save note" quickly
    Then exactly one "POST /api/notes" request is sent
    And the "Save note" button is disabled while the request is pending
    And "Double click check" appears once in the note list
    And after a reload "Double click check" still appears once in the note list

  Scenario: Pressing Enter twice quickly stores the note once (criterion 1)
    Given the network is throttled so a save stays in flight
    When I type "Enter twice check" in the "New note" field
    And I press Enter twice quickly
    Then exactly one "POST /api/notes" request is sent
    And "Enter twice check" appears once in the note list

  Scenario: The form accepts the next submit after a successful save (criterion 2)
    Given I saved the note "First note"
    Then the "Save note" button is enabled again
    When I type "Second note" in the "New note" field
    And I click "Save note"
    Then "Second note" appears in the note list below "First note"

  Scenario: A failed save can be retried (criterion 2, edge case)
    Given the backend is stopped
    When I type "Retry note" in the "New note" field
    And I click "Save note"
    Then I see "The note could not be saved. Please try again."
    And the "New note" field still contains "Retry note"
    And the "Save note" button is enabled
    When the backend is started again
    And I click "Save note"
    Then "Retry note" appears once in the note list
    And the error message is gone
