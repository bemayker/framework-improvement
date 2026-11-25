Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of Task Notes
  I want a quick second click on "Save note" to be ignored while the first save is pending
  So that one note is stored once, while a deliberate later save of the same text still works

  # The tracker item has no description. The three criteria are derived from the title
  # and recorded as a scope change in the plan; the tester should treat them as assumptions.

  Background:
    Given the Task Notes stack is running and reachable at "http://localhost:5183"
    And the landing page is open

  Scenario: Criterion 1, a double click on Save note stores the note once
    Given I typed "BUG-04 double click 1" in the "New note" field
    When I double click "Save note" quickly
    Then exactly one "POST /api/notes" request is sent
    And the "Save note" button is disabled while the request is pending
    And "BUG-04 double click 1" appears exactly once in the list
    And the "New note" field is empty
    When I reload the page
    Then "BUG-04 double click 1" is listed exactly once

  Scenario: Criterion 2, Save note is usable again after a successful save
    Given I saved "BUG-04 next note" with a single click
    Then the "Save note" button is enabled again
    When I type "BUG-04 after that" and click "Save note" once
    Then a second "POST /api/notes" request is sent
    And "BUG-04 after that" appears below "BUG-04 next note"

  Scenario: Criterion 2, Save note is usable again after a failed save
    Given the backend is stopped
    When I type "BUG-04 offline" and click "Save note"
    Then the message "The note could not be saved. Please try again." is shown
    And the text "BUG-04 offline" stays in the field
    And the "Save note" button is enabled
    When the backend is started again and I click "Save note"
    Then the error disappears
    And "BUG-04 offline" is added to the list

  Scenario: Criterion 3, a deliberate second save of the same text stores a second note
    Given I saved "BUG-04 same text" with a single click
    And the "Save note" button is enabled again
    When I type "BUG-04 same text" again and click "Save note" once
    Then a second "POST /api/notes" request is sent
    And "BUG-04 same text" is listed twice

  Scenario: Pressing Enter twice while saving stores the note once (edge case)
    Given I typed "BUG-04 enter twice" in the "New note" field
    When I press Enter twice quickly
    Then exactly one "POST /api/notes" request is sent
    And "BUG-04 enter twice" appears exactly once in the list
