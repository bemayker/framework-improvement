Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick second click or second Enter press to be ignored while my note is being saved
  So that one note I wrote is stored once and not twice

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Clicking Save note twice quickly stores the note once
    Given the landing page is open
    And saving a note takes long enough to click twice before it finishes
    When I type "Double click check 1" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" twice in quick succession
    Then the save button identified by "note-submit" is dimmed and disabled while the save is pending
    And exactly one request to store a note was sent
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And "Double click check 1" is still shown exactly once after I reload the page

  Scenario: The form accepts the next submission after a save finished
    Given I saved the note "Repeat me" and the save has finished
    And the save button identified by "note-submit" is enabled again
    When I type "Repeat me" into the note field identified by "note-input" again
    And I click the save button identified by "note-submit" once
    Then "Repeat me" is shown twice in the notes list identified by "note-list", because a deliberate second save is allowed

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    And saving a note takes long enough to press Enter twice before it finishes
    When I type "Enter check 1" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one request to store a note was sent
    And "Enter check 1" is shown exactly once in the notes list identified by "note-list"
    And "Enter check 1" is still shown exactly once after I reload the page

  Scenario: A failed save does not leave the form stuck (edge case)
    Given the landing page is open
    And the browser is offline
    When I type "Offline check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the validation message identified by "note-form-error" saying the note could not be saved
    And the text "Offline check" is still in the note field
    And the save button identified by "note-submit" is enabled again
    When the browser is back online
    And I click the save button identified by "note-submit"
    Then "Offline check" is shown exactly once in the notes list identified by "note-list"
    And the message identified by "note-form-error" is gone
