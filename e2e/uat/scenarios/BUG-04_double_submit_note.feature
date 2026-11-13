Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick second submission of the note form to be ignored while the first save is running
  So that a note I saved once is stored and listed once

  Background:
    Given the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Clicking Save note twice quickly stores the note once
    Given the landing page is open
    And saving a note takes a few seconds because the network is slow
    When I type "Buy milk BUG-04" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then the save button is disabled while the save is in progress
    And exactly one create request for the note is sent to the backend
    And once the save completes "Buy milk BUG-04" is shown once in the notes list identified by "note-list"
    And the note field is empty and the save button is enabled again
    And after I reload the page "Buy milk BUG-04" is still listed exactly once

  Scenario: The form accepts the next submission once a save has completed
    Given the landing page is open
    And I saved the note "Walk dog BUG-04" and it is shown in the notes list
    When I type "Feed cat BUG-04" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "Feed cat BUG-04" is shown in the notes list below "Walk dog BUG-04"

  Scenario: A failed save can be retried (edge case)
    Given the landing page is open
    And the backend is unavailable
    When I type "Water plants BUG-04" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text stays in the note field and the save button is enabled again
    When the backend is available again
    And I press the save button identified by "note-submit"
    Then "Water plants BUG-04" is shown once in the notes list identified by "note-list"
    And the error message is gone

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    And saving a note takes a few seconds because the network is slow
    When I type "Call mum BUG-04" into the note field identified by "note-input"
    And I press Enter twice in the note field
    Then exactly one create request for the note is sent to the backend
    And "Call mum BUG-04" is shown once in the notes list identified by "note-list"
