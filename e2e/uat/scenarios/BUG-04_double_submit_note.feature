Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double submit of the note form to save my note only once
  So that my notes list never holds accidental duplicates

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A quick double submit sends one save request and stores the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit" as fast as I can
    Then exactly one save request is sent to "POST /api/notes"
    And "Double click check 1" appears once in the notes list identified by "note-list"
    And after I reload the page "Double click check 1" still appears exactly once

  Scenario: The save button is disabled while a save is in progress and enabled once it completes
    Given the landing page is open
    And the network is slowed so a save stays in flight long enough to observe
    When I type "Slow save check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled and pressing it again sends no second request
    And once the save finishes "Slow save check" appears once in the notes list
    And the save button is enabled again

  Scenario: After a failed save the button is enabled again and the note can be saved by submitting once more
    Given the landing page is open
    And the browser is offline
    When I type "Retry check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still contains "Retry check"
    And the save button is enabled
    When the browser is back online
    And I press the save button identified by "note-submit" once
    Then the message disappears and the note field is empty
    And "Retry check" appears once in the notes list

  Scenario: Pressing Enter twice quickly also stores the note once (edge case)
    Given the landing page is open
    When I type "Double enter check 2" into the note field identified by "note-input"
    And I press Enter twice rapidly
    Then exactly one save request is sent to "POST /api/notes"
    And "Double enter check 2" appears once in the notes list
    And after I reload the page "Double enter check 2" still appears exactly once
