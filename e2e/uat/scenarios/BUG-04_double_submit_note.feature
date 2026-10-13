Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second submit of the note form to be ignored while the first save is running
  So that one note I meant to save is stored and listed exactly once

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Two quick submits store exactly one note
    Given the landing page is open
    And saving a note takes several seconds because the network is slow
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" and press it again before the first save has finished
    And I press Enter in the note field before the first save has finished
    Then exactly one create request is sent to the backend
    And "BUG-04 double click check" is shown exactly once in the notes list identified by "note-list"
    And after I reload the page "BUG-04 double click check" is still shown exactly once

  Scenario: The save button is disabled while a save is in progress
    Given the landing page is open
    And saving a note takes several seconds because the network is slow
    When I type "BUG-04 disabled check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then while the save is still in progress the save button identified by "note-submit" is disabled
    And pressing it again does nothing

  Scenario: The save button is enabled again once the save has completed
    Given I pressed the save button identified by "note-submit" and the save has just finished
    When I look at the note form
    Then the note is shown in the notes list identified by "note-list"
    And the save button identified by "note-submit" is enabled again

  Scenario: The save button is enabled again after a failed save (edge case)
    Given the landing page is open
    And the browser has no network connection
    When I type "BUG-04 offline check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text "BUG-04 offline check" is still in the note field
    And the save button identified by "note-submit" is enabled again so I can retry

  Scenario: A second, different note can be saved after the first completes (edge case)
    Given I saved the note "BUG-04 first note" and the save has finished
    When I type "BUG-04 second note" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then both "BUG-04 first note" and "BUG-04 second note" are shown once each in the notes list identified by "note-list"
    And the save button identified by "note-submit" is enabled again
