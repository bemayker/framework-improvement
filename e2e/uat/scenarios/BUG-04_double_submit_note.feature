Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a note I submit twice in quick succession to be saved only once
  So that my list does not fill up with accidental duplicates

  Background:
    Given the Task Notes app is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"
    And the note field is identified by "note-input" and the save button by "note-submit"

  Scenario: A second submit while the first save is in flight stores the note once
    Given the landing page is open
    And the save request for a new note is slow, so the save stays in flight
    When I type "Double save check 1" into the note field
    And I press the save button
    And I press the save button again and press Enter in the note field before the save has finished
    Then exactly one create request to "/api/notes" is sent
    And "Double save check 1" is shown exactly once in the notes list
    And after reloading the page "Double save check 1" is still listed exactly once

  Scenario: The save button is disabled while a save is in flight
    Given the landing page is open
    And the save request for a new note is slow, so the save stays in flight
    When I type "Disabled button check" into the note field
    And I press the save button
    Then the save button is disabled while the request is pending
    And once the save has finished the button is enabled again
    And "Disabled button check" is shown in the notes list

  Scenario: A failed save can be retried with exactly one new request
    Given the landing page is open
    And the create request to "/api/notes" fails
    When I type "Retry check" into the note field
    And I press the save button
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And the text "Retry check" is still in the note field
    And the save button is enabled
    When the create request is working again
    And I press the save button once
    Then exactly one new create request is sent
    And "Retry check" is shown exactly once in the notes list
    And the message identified by "note-form-error" is gone

  Scenario: An empty submit while idle still shows the validation message (edge case)
    Given the landing page is open
    And the note field is empty
    When I press the save button
    Then I see the message identified by "note-form-error" telling me to enter a note before saving
    And the save button is enabled
    And no create request is sent
