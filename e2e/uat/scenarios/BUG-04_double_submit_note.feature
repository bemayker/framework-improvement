Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want one Save on one form to store exactly one note
  So that a double click, or a click followed by Enter, never creates a duplicate

  Background:
    Given the Task Notes stack is running
    And the frontend is open at "http://localhost:5183/"
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: Two quick saves send one create request and store one note (criterion 1)
    Given I entered "Double click check" in the "New note" field
    When I double-click "Save note"
    Then exactly one "POST /api/notes" request is sent
    And "Double click check" appears once in the note list
    When I enter "Click then enter check", click "Save note" and press Enter before the first save has answered
    Then exactly one "POST /api/notes" request is sent for "Click then enter check"
    And "Click then enter check" appears once in the note list
    And after reloading the page each of the two notes appears exactly once

  Scenario: The Save button is disabled while a save is in flight (criterion 2)
    Given the network is throttled so a save takes a few seconds
    When I enter "Slow save check" and click "Save note"
    Then the "Save note" button is disabled while the request is pending
    And clicking the disabled button sends no further request
    When the request has finished
    Then "Slow save check" appears once in the note list
    And the "New note" field is empty
    And the "Save note" button is enabled again

  Scenario: One more Save after a failed save sends exactly one new request (criterion 3)
    Given the backend is stopped
    And I entered "Retry check" in the "New note" field
    When I click "Save note"
    Then the message "The note could not be saved. Please try again." is shown
    And "Retry check" is still in the "New note" field
    And the "Save note" button is enabled again
    When the backend is started again
    And I click "Save note" once
    Then exactly one new "POST /api/notes" request is sent
    And "Retry check" appears once in the note list
    And the error message is no longer shown

  Scenario: Two deliberate saves of the same text, one after the other has answered, store two notes (edge case)
    Given I entered "Same text twice" in the "New note" field
    And I clicked "Save note" and the note appeared in the list
    When I enter "Same text twice" in the "New note" field again
    And I click "Save note"
    Then "Same text twice" appears twice in the note list
    And two "POST /api/notes" requests were sent in total
