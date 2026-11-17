Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I submit twice in quick succession to be saved only once
  So that my notes list does not fill up with accidental duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double-clicked note is saved once, also after reload
    Given the landing page is open
    When I type "BUG-04 double click 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And "BUG-04 double click 1" is shown once in the notes list identified by "note-list"
    And after I reload the page "BUG-04 double click 1" is still shown exactly once

  Scenario: The form accepts the next save once the previous save has completed
    Given I just saved the note "BUG-04 after success A"
    When I type "BUG-04 after success B" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then "BUG-04 after success B" is shown in the notes list identified by "note-list"
    And the save button was not left disabled by the first save

  Scenario: A failed save can be retried once the backend is back
    Given saving failed because the backend was unreachable
    And the note field still holds "BUG-04 retry"
    And the save button identified by "note-submit" is enabled
    When the backend is reachable again and I press the save button once more
    Then the error message disappears
    And "BUG-04 retry" is shown once in the notes list identified by "note-list"

  Scenario: Pressing Enter twice in the note field saves the note once (edge case)
    Given the landing page is open
    When I type "BUG-04 double enter 1" into the note field identified by "note-input"
    And I press Enter twice quickly
    Then exactly one save request is sent to the backend
    And "BUG-04 double enter 1" is shown once in the notes list identified by "note-list"
