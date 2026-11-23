Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick second click or Enter while a note is being saved to be ignored
  So that every note I write is stored and listed exactly once

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double click on Save note stores the note once
    Given the landing page is open
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double click the save button identified by "note-submit" while the save is still in progress
    Then exactly one create request is sent to the backend
    And "BUG-04 double click check" is shown exactly once in the notes list identified by "note-list"
    And after I reload the page it is still shown exactly once

  Scenario: The save button is disabled while a save is in progress
    Given the landing page is open
    And a save is in progress because the connection is slow
    When I look at the save button identified by "note-submit"
    Then it is greyed out and cannot be clicked
    And clicking it again sends no second create request

  Scenario: The save button works again after a save finished
    Given I just saved the note "BUG-04 first" and it is shown in the notes list
    When I type "BUG-04 second" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "BUG-04 second" is saved and shown in the notes list identified by "note-list"
    And I did not have to reload the page

  Scenario: The save button works again after a failed save (edge case)
    Given the backend is not reachable
    When I type "BUG-04 offline" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text "BUG-04 offline" stays in the note field
    And the save button identified by "note-submit" can be clicked again
    And once the backend is reachable again, pressing it saves the note exactly once

  Scenario: Pressing Enter twice while saving stores the note once (edge case)
    Given the landing page is open
    When I type "BUG-04 enter check" into the note field identified by "note-input"
    And I press Enter twice quickly while the save is still in progress
    Then exactly one create request is sent to the backend
    And "BUG-04 enter check" is shown exactly once in the notes list identified by "note-list"
