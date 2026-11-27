Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second click on Save note to be ignored while the first save is pending
  So that my note is stored exactly once

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double clicking Save note stores the note once
    Given the landing page is open
    And the first save stays pending because the network is slow
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I double click the save button identified by "note-submit"
    Then exactly one request to create a note was sent
    And "BUG-04 double click check" is shown once in the notes list identified by "note-list"
    And after I reload the page "BUG-04 double click check" is still shown exactly once

  Scenario: Save note is disabled while a save is pending
    Given the landing page is open
    And the first save stays pending because the network is slow
    When I type "BUG-04 disabled check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then the save button is disabled while the save is pending
    And clicking it again sends no second request
    And once the save has succeeded the save button is enabled again

  Scenario: A failed save can be retried once
    Given the backend is stopped
    And the landing page is open
    When I type "BUG-04 retry check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still holds "BUG-04 retry check"
    And the save button is enabled
    When the backend is started again
    And I click the save button identified by "note-submit" once
    Then exactly one new request to create a note was sent and it succeeded
    And the error message is gone
    And "BUG-04 retry check" is shown once in the notes list identified by "note-list"

  Scenario: A deliberate second save of the same text is still stored
    Given the landing page is open
    And I saved the note "BUG-04 same text" and it appeared in the list
    When I type "BUG-04 same text" again and press the save button identified by "note-submit"
    Then "BUG-04 same text" is shown twice in the notes list identified by "note-list"
    And after I reload the page both notes are still shown

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    And the first save stays pending because the network is slow
    When I type "BUG-04 enter check" into the note field identified by "note-input"
    And I press Enter twice in quick succession
    Then exactly one request to create a note was sent
    And "BUG-04 enter check" is shown once in the notes list identified by "note-list"
