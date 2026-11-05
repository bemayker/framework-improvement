Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double click on "Save note" to save my note only once
  So that my list does not fill up with duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-click on Save note stores the note once
    Given the landing page is open
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And "BUG-04 double click check" is shown once in the notes list identified by "note-list"
    And after I reload the page "BUG-04 double click check" is still shown exactly once

  Scenario: While a save is in flight the button is disabled and further submits are ignored
    Given the landing page is open
    And saving a note is slow, so a save stays in progress for a few seconds
    When I type "BUG-04 slow save" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    And I click the save button identified by "note-submit" three more times while the save is still in progress
    Then the save button is shown as disabled
    And only one save request was sent to the backend
    And once the save finishes "BUG-04 slow save" is shown once in the notes list identified by "note-list"

  Scenario: After a save finishes the form accepts a new note
    Given the landing page is open
    When I type "BUG-04 first" into the note field identified by "note-input" and press the save button identified by "note-submit"
    And I type "BUG-04 second" into the note field and press the save button again
    Then "BUG-04 first" and "BUG-04 second" are both shown in the notes list as separate entries
    And the save button is enabled

  Scenario: After a failed save the text is kept and the user can retry
    Given the landing page is open
    And the backend is not reachable
    When I type "BUG-04 offline" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still reads "BUG-04 offline"
    And the save button is enabled
    When the backend is reachable again and I press the save button again
    Then "BUG-04 offline" is shown once in the notes list identified by "note-list"

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    And saving a note is slow, so a save stays in progress for a few seconds
    When I type "BUG-04 enter twice" into the note field identified by "note-input"
    And I press Enter twice in quick succession in the note field
    Then only one save request was sent to the backend
    And "BUG-04 enter twice" is shown once in the notes list identified by "note-list"
