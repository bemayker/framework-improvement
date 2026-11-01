Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double click or double Enter on the note form to save my note only once
  So that my list does not fill up with duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Clicking save twice before the first save answers stores the note once
    Given the landing page is open
    And saving a note is slow
    When I type "Double click check 1" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" twice in quick succession
    Then the save button is disabled while the save is pending
    And exactly one "POST /api/notes" request is sent
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And the note field is empty again
    And after I reload the page "Double click check 1" is still shown exactly once

  Scenario: The form accepts the next note once a save has finished
    Given the landing page is open
    And I have just saved the note "After success 1"
    When I type "After success 2" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then the save button was enabled again before I clicked it
    And "After success 2" is shown in the notes list identified by "note-list" below "After success 1"
    And one "POST /api/notes" request was sent per save

  Scenario: The form accepts a new submission after a failed save (edge case)
    Given the landing page is open
    And requests to "/api/notes" are blocked
    When I type "After failure 1" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text stays in the note field and the save button is enabled again
    When the block on "/api/notes" is removed
    And I click the save button identified by "note-submit" again
    Then the message disappears
    And "After failure 1" is shown exactly once in the notes list identified by "note-list"

  Scenario: Pressing Enter twice before the first save answers stores the note once (edge case)
    Given the landing page is open
    And saving a note is slow
    When I type "Double enter check 1" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one "POST /api/notes" request is sent
    And "Double enter check 1" is shown exactly once in the notes list identified by "note-list"
