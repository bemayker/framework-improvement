Feature: BUG-04 Saving a note twice quickly stores it only once
  As a user of the Task Notes app
  I want a double-click on "Save note" to save my note a single time
  So that my list does not fill up with duplicates

  Background:
    Given the Task Notes app is running
    And I have opened the landing page

  Scenario: Double-clicking "Save note" stores the note once
    When I type "BUG-04 double click check" in the "New note" field
    And I double-click "Save note" while the first save is still in flight
    Then the note "BUG-04 double click check" appears exactly once in the note list
    And the note is still listed exactly once after I reload the page

  Scenario: The form accepts a new note after a save has finished
    Given I have just saved the note "BUG-04 first note"
    When I type "BUG-04 second note" in the "New note" field
    And I click "Save note"
    Then "BUG-04 second note" appears in the note list
    And the "Save note" button is enabled

  Scenario: A failed save re-enables the form and keeps the text (edge case)
    Given the backend is unreachable
    When I type "BUG-04 offline note" in the "New note" field
    And I click "Save note"
    Then I see the message "The note could not be saved. Please try again."
    And the "New note" field still contains "BUG-04 offline note"
    And the "Save note" button is enabled
