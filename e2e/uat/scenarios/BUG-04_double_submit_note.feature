Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second submit of the note form to be ignored while the first save is in flight
  So that each note I write is stored exactly once

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"
    And every note text below ends with a suffix that is new for this run, so notes from earlier runs never match

  Scenario: A quick double submit stores the note once
    Given the landing page is open
    And saving is slow, so a save stays in flight for a few seconds
    When I type "Buy milk {suffix}" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And "Buy milk {suffix}" is shown once in the notes list identified by "note-list"
    And after I reload the page "Buy milk {suffix}" is still shown once

  Scenario: The save button is disabled while a save is in flight
    Given the landing page is open
    And saving is slow, so a save stays in flight for a few seconds
    When I type "Water the plants {suffix}" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" once
    Then the save button is disabled and clicking it again does nothing
    And once "Water the plants {suffix}" appears in the notes list the save button is enabled again

  Scenario: The form accepts a new note once the save has settled
    Given I just saved the note "First note {suffix}" and it is shown in the notes list
    When I type "Second note {suffix}" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "Second note {suffix}" is saved once and shown in the notes list identified by "note-list"
    And the save button is enabled again

  Scenario: A failed save keeps the text and a retry sends one request (edge case)
    Given the backend is unreachable
    When I type "Retry me {suffix}" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the message identified by "note-form-error" saying the note could not be saved
    And the note field still reads "Retry me {suffix}" and the save button is enabled
    When the backend is reachable again and I press the save button once
    Then exactly one new save request is sent and "Retry me {suffix}" is shown once in the notes list

  Scenario: Pressing Enter right after clicking save stores the note once (edge case)
    Given the landing page is open
    And saving is slow, so a save stays in flight for a few seconds
    When I type "Enter repeat {suffix}" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    And I immediately press Enter in the note field
    Then exactly one save request is sent to the backend
    And "Enter repeat {suffix}" is shown once in the notes list identified by "note-list"
