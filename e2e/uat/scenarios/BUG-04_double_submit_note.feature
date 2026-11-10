Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick second click or Enter on Save to be ignored while the first save is running
  So that one note I wrote is never stored twice by accident

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double click on Save stores the note once
    Given the landing page is open
    And I typed "Double click check 1" into the note field identified by "note-input"
    When I double-click the save button identified by "note-submit" as fast as I can
    Then exactly one create request is sent to the backend
    And "Double click check 1" is shown exactly once in the notes list identified by "note-list"
    And "Double click check 1" is still shown exactly once after I reload the page

  Scenario: Save is disabled while a save is in flight and enabled again after it succeeds
    Given the landing page is open
    And the network is slow enough that a save takes a visible amount of time
    And I typed "Disabled check" into the note field identified by "note-input"
    When I press the save button identified by "note-submit" once
    Then the save button is disabled while the request is pending
    And once the request finishes "Disabled check" is shown in the notes list identified by "note-list"
    And the save button is enabled again

  Scenario: A failed save re-enables Save so it can be retried
    Given the landing page is open
    And the backend cannot be reached
    And I typed "Failure retry check" into the note field identified by "note-input"
    When I press the save button identified by "note-submit"
    Then I see the error "The note could not be saved. Please try again."
    And "Failure retry check" is still in the note field
    And the save button is enabled again
    When the backend is reachable again and I press the save button again
    Then "Failure retry check" is shown exactly once in the notes list identified by "note-list"

  Scenario: A save after the previous one finished is stored even with identical text
    Given the landing page is open
    And I saved the note "Same text twice" and it is shown in the notes list
    When I type "Same text twice" again and press the save button identified by "note-submit"
    Then "Same text twice" is shown twice in the notes list identified by "note-list"

  Scenario: Pressing Enter twice quickly stores the note once (edge case)
    Given the landing page is open
    And I typed "Enter twice check 1" into the note field identified by "note-input"
    When I press Enter twice quickly in the note field
    Then exactly one create request is sent to the backend
    And "Enter twice check 1" is shown exactly once in the notes list identified by "note-list"
