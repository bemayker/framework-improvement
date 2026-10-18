Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick second submit of the same note to be ignored while the first save is running
  So that one save action never stores or lists the note twice

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form", the field identified by "note-input", the button identified by "note-submit" and the notes list identified by "note-list"

  Scenario: A second submit while the first save is in flight stores the note once
    Given the landing page is open
    And save requests to "POST /api/notes" are held until released
    When I type "Enter check 1" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    And I press Enter in the note field identified by "note-input" before the save has finished
    And the held save request is released
    Then exactly one "POST /api/notes" request was sent
    And "Enter check 1" is shown exactly once in the notes list identified by "note-list"
    And the note field is empty again

  Scenario: The save button is disabled while a save is in flight and enabled again afterwards
    Given the landing page is open
    And the network is slow so that a save takes a few seconds
    When I type "Disabled check 2" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button identified by "note-submit" is disabled and clicking it again does nothing
    When "Disabled check 2" appears in the notes list identified by "note-list"
    Then the save button identified by "note-submit" is enabled again

  Scenario: The form accepts the next submit after a save, including a retry after a failed save
    Given the landing page is open
    And the browser is offline
    When I type "Retry check 3" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text "Retry check 3" is still in the note field
    And the save button identified by "note-submit" is enabled
    When the browser is back online
    And I press the save button identified by "note-submit" again
    Then "Retry check 3" is shown exactly once in the notes list identified by "note-list"
    And the error message is gone
    When I type "Second note 3" into the note field and press the save button
    Then "Second note 3" is shown exactly once in the notes list identified by "note-list"

  Scenario: A double-click on Save note stores the note once (edge case)
    Given the landing page is open
    And save requests to "POST /api/notes" are held until released
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    And the held save request is released
    Then exactly one "POST /api/notes" request was sent
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"

  Scenario: An empty submit does not disable the button (edge case)
    Given the landing page is open
    And the note field identified by "note-input" is empty
    When I press the save button identified by "note-submit"
    Then I see the message "Enter a note before saving."
    And the save button identified by "note-submit" stays enabled
