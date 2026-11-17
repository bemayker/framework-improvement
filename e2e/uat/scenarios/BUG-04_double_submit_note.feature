Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I save to be stored once, however fast I click
  So that my note list does not fill up with accidental duplicates

  Background:
    Given the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Two quick clicks on Save note store the note once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" twice in quick succession, before the first save has returned
    Then exactly one request to create the note was sent
    And "Double click check 1" is shown once in the notes list identified by "note-list"
    And when I reload the page, "Double click check 1" is still shown exactly once

  Scenario: The save button is disabled while a save is in flight
    Given the landing page is open
    And I typed "Slow save check" into the note field identified by "note-input"
    When I press the save button identified by "note-submit" and the save has not returned yet
    Then the save button is disabled
    And pressing Enter in the note field sends no second request
    And pressing the save button again sends no second request
    And "Slow save check" is shown once in the notes list once the save returns

  Scenario: The save button is enabled again once the save has finished
    Given I saved the note "After success" and the save has returned
    Then the save button identified by "note-submit" is enabled again

  Scenario: A failed save keeps the text and can be retried once (edge case)
    Given the backend is unavailable
    And I typed "Retry after failure" into the note field identified by "note-input"
    When I press the save button identified by "note-submit"
    Then I see the validation message identified by "note-form-error" saying the note could not be saved
    And the note field still contains "Retry after failure"
    And the save button is enabled again
    And when the backend is available again and I press the save button, "Retry after failure" is shown exactly once in the notes list
