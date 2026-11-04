Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double click on "Save note" to store my note only once
  So that my notes list does not fill up with accidental duplicates

  # Note texts below are shown without the suffix. Each run appends its own unique
  # suffix (for example the current time) so repeated runs against the same database
  # never see notes saved by an earlier run, and counts apply to the full text.
  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Clicking Save note twice before the first save finishes stores the note once
    Given the landing page is open
    And saving a note is slow, so the first save is still in progress when I click again
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" twice in quick succession
    Then exactly one request to create a note was sent to the backend
    And "BUG-04 double click check" is shown exactly once in the notes list identified by "note-list"
    And when I reload "http://localhost:5183" in the browser, "BUG-04 double click check" is still shown exactly once

  Scenario: The save button is disabled while a save is in progress and enabled again afterwards
    Given the landing page is open
    And saving a note is slow
    When I type "BUG-04 disabled state" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then the save button is disabled while the save is in progress
    And when the save finishes, "BUG-04 disabled state" is shown in the notes list identified by "note-list"
    And the save button is enabled again

  Scenario: The save button is enabled again after a failed save so I can retry (edge case)
    Given the landing page is open
    And the backend cannot be reached
    When I type "BUG-04 offline retry" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the error message identified by "note-form-error" saying the note could not be saved
    And the text "BUG-04 offline retry" is still in the note field
    And the save button is enabled again
    And when the backend can be reached again and I click the save button once more, "BUG-04 offline retry" is shown once in the notes list

  Scenario: A second, different note saves normally after the first one finished (edge case)
    Given the landing page is open
    And I saved the note "BUG-04 first note" and it is shown in the notes list identified by "note-list"
    When I type "BUG-04 second note" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then "BUG-04 second note" is shown in the notes list identified by "note-list"
    And "BUG-04 first note" is still shown exactly once
