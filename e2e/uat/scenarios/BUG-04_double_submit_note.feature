Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the task notes app
  I want a rapid double submit to save my note only once
  So that my list does not contain duplicates

  Scenario: Criterion 1 - a double-click on Save note stores one note
    Given the landing page is open and saving takes a few seconds
    And I typed "Buy milk" in the "New note" field
    When I double-click "Save note"
    Then exactly one POST /api/notes request is sent
    And "Buy milk" appears once in the list

  Scenario: Criterion 2 - the button is disabled while saving and enabled afterwards
    Given the landing page is open and saving takes a few seconds
    And I typed "Buy milk" in the "New note" field
    When I click "Save note"
    Then "Save note" is disabled while the save is in flight
    And "Save note" is enabled again once the note appears in the list

  Scenario: Criterion 3 - the form is usable after a failed save
    Given the landing page is open and the backend is down
    And I typed "Buy milk" in the "New note" field
    When I click "Save note"
    Then the message "The note could not be saved. Please try again." is shown
    And the field still holds "Buy milk"
    And "Save note" is enabled

  Scenario: Edge case - a click followed by Enter stores one note
    Given the landing page is open and saving takes a few seconds
    And I typed "Buy milk" in the "New note" field
    When I click "Save note" and then press Enter in the field
    Then exactly one POST /api/notes request is sent
    And "Buy milk" appears once in the list
