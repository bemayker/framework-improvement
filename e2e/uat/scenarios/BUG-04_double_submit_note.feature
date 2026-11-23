Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick double submit of the note form to store my note only once
  So that my notes list is not cluttered with duplicates

  Background:
    Given the application is running at "http://localhost:5183"
    And the landing page shows the note field identified by "note-input", the save button identified by "note-submit" and the notes list identified by "note-list"

  Scenario: A quick double click on Save note stores the note once
    Given the landing page is open
    And the network is slow enough that a save takes a few seconds
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one "POST /api/notes" request is sent
    And "BUG-04 double click check" is shown once in the notes list identified by "note-list"
    And when I reload the page "BUG-04 double click check" is still listed exactly once

  Scenario: The save button is disabled while a save is in progress
    Given the landing page is open
    And the network is slow enough that a save takes a few seconds
    When I type "BUG-04 disabled check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then the save button identified by "note-submit" is disabled while the request is pending
    And when I press Enter twice in the note field identified by "note-input" no further request is sent
    And "BUG-04 disabled check" is shown once in the notes list identified by "note-list" after the save finishes

  Scenario: The save button is enabled again after the save finishes
    Given the landing page is open
    When I type "BUG-04 next note one" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then "BUG-04 next note one" is shown in the notes list identified by "note-list"
    And the save button identified by "note-submit" is enabled again
    And I can save a second note "BUG-04 next note two" straight away

  Scenario: A failed save re-enables the button so the note can be retried (edge case)
    Given the landing page is open
    And the network is offline
    When I type "BUG-04 retry check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the error message identified by "note-form-error" saying the note could not be saved
    And the text "BUG-04 retry check" is still in the note field
    And the save button identified by "note-submit" is enabled
    When the network is back and I click the save button identified by "note-submit" again
    Then "BUG-04 retry check" is shown once in the notes list identified by "note-list"
    And the error message identified by "note-form-error" is gone
