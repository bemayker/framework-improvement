Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double submit of the note form to save the note only once
  So that my note list does not fill with duplicates

  Background:
    Given the Task Notes backend and frontend are running
    And I have opened the landing page at "http://localhost:5183/"

  Scenario: Criterion 1 - clicking Save note twice quickly stores the note once
    When I type "BUG-04 double click check" in the "New note" field
    And I click "Save note" twice in quick succession
    Then the note "BUG-04 double click check" appears exactly once in the note list
    And after I reload the page the note is still listed exactly once

  Scenario: Criterion 2 - the button is disabled while a save is in flight
    Given the save request is slow
    When I type "BUG-04 slow save" in the "New note" field
    And I click "Save note"
    Then the "Save note" button is disabled while the request is pending
    When I click "Save note" again and press Enter in the field
    Then no second save request is sent
    And once the request finishes the note "BUG-04 slow save" appears exactly once in the note list

  Scenario: Criterion 3 - the button is enabled again after a save ends
    When I type "BUG-04 first note" in the "New note" field
    And I click "Save note"
    Then the note "BUG-04 first note" appears in the note list
    And the "Save note" button is enabled
    When I type "BUG-04 second note" in the "New note" field
    And I click "Save note"
    Then the note "BUG-04 second note" appears in the note list below the first

  Scenario: Criterion 3 - the button is enabled again after a failed save so it can be retried
    Given the backend is stopped
    When I type "BUG-04 retry note" in the "New note" field
    And I click "Save note"
    Then the message "The note could not be saved. Please try again." is shown
    And the "New note" field still holds "BUG-04 retry note"
    And the "Save note" button is enabled
    When the backend is started again
    And I click "Save note"
    Then the message disappears
    And the note "BUG-04 retry note" appears exactly once in the note list

  Scenario: Edge case - a second, different note saves normally after the first
    Given I have saved the note "BUG-04 first note"
    When I type "BUG-04 second note" in the "New note" field
    And I click "Save note"
    Then both "BUG-04 first note" and "BUG-04 second note" are listed, each exactly once
