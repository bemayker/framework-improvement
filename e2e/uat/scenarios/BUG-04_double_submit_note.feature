Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a fast double click on "Save note" to save my note only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-clicked note is stored once
    Given the landing page is open
    And saving a note takes a noticeable moment
    When I type "Buy milk BUG-04" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And exactly one "Buy milk BUG-04" entry appears in the notes list identified by "note-list"
    And after I reload the page the list still shows "Buy milk BUG-04" exactly once

  Scenario: The save button is disabled while saving and usable again afterwards
    Given the landing page is open
    And saving a note takes a noticeable moment
    When I type "Walk dog BUG-04" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled while the save is pending
    And a second click on it sends no second save request
    When the save finishes
    Then "Walk dog BUG-04" is shown once in the notes list
    And the note field is empty
    And the save button is enabled again

  Scenario: The same text saved again deliberately is stored again (edge case)
    Given I saved the note "Walk dog BUG-04" and the save has finished
    When I type "Walk dog BUG-04" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then a second "Walk dog BUG-04" entry appears in the notes list
    And the list shows "Walk dog BUG-04" twice

  Scenario: The button is usable again after a failed save (edge case)
    Given the landing page is open
    And the browser is offline
    When I type "Offline note BUG-04" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And the text "Offline note BUG-04" stays in the note field
    And the save button is enabled again
    When the browser is back online and I press the save button again
    Then "Offline note BUG-04" is shown once in the notes list
    And the error message is gone
