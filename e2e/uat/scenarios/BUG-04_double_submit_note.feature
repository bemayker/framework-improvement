Feature: BUG-04 Saving a note twice quickly stores it once
  As a Task Notes user
  I want a double submit of the note form to save the note only once
  So that my list does not contain duplicates

  Background:
    Given the Task Notes app is running at "http://localhost:5183"
    And I am on the landing page

  Scenario: A double click on Save note stores one note (criterion 1)
    Given the network is throttled so the save takes a while
    When I type "Buy milk BUG-04 a1" into the "New note" field
    And I double-click "Save note"
    Then the "Save note" button is disabled right after the first click
    And exactly one "POST /api/notes" request is sent
    When the request finishes
    Then "Buy milk BUG-04 a1" appears once in the note list
    And the "New note" field is empty
    And after a reload "Buy milk BUG-04 a1" is still listed exactly once

  Scenario: Pressing Enter twice stores one note (criterion 1, edge case)
    Given the network is throttled so the save takes a while
    When I type "Call mum BUG-04 a1" into the "New note" field
    And I press Enter twice in the field
    Then exactly one "POST /api/notes" request is sent
    And "Call mum BUG-04 a1" appears once in the note list

  Scenario: The form accepts the next submit after a successful save (criterion 2)
    Given I just saved the note "Walk dog BUG-04 a1"
    When I type "Feed cat BUG-04 a1" and click "Save note"
    Then a second "POST /api/notes" request is sent
    And "Feed cat BUG-04 a1" appears below "Walk dog BUG-04 a1"

  Scenario: The form accepts the next submit after a failed save (criterion 2)
    Given the backend is stopped
    When I type "Water plants BUG-04 a1" and click "Save note"
    Then the message "The note could not be saved. Please try again." is shown
    And the text stays in the field
    And the "Save note" button is enabled again
    When the backend is started again and I click "Save note"
    Then the message disappears
    And "Water plants BUG-04 a1" appears once in the note list
