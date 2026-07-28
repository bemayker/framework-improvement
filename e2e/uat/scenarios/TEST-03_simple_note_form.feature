Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to write a note and see it in a list of saved notes
  So that I can keep track of what needs doing

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5173"
    And the landing page shows the notes section identified by "notes-section"

  Scenario: A submitted note is saved and appears in the notes list
    Given the app is open and the notes list identified by "note-list" is shown
    When I type "Buy milk" into the note input identified by "note-input"
    And I press the button identified by "note-submit" labelled "Add note"
    Then "Buy milk" appears in the notes list
    And the page does not reload while the note is added
    And the note input is empty again, ready for the next note

  Scenario: An empty note is rejected with a visible message
    Given the app is open and the note input is empty
    When I press the button identified by "note-submit" labelled "Add note"
    Then I see the validation message "Note text is required" identified by "note-error"
    And no note is added to the notes list
    And nothing is sent to the server

  Scenario: Saved notes are still there after reloading the page
    Given I have saved the note "Call the dentist"
    When I reload the page in the browser
    Then "Call the dentist" is still shown in the notes list identified by "note-list"
    And it is shown because the app read it back from the database, not from anything kept in the browser

  Scenario: A note of only spaces is rejected (edge case)
    Given the app is open and the notes list is shown
    When I type only spaces into the note input identified by "note-input"
    And I press the button identified by "note-submit" labelled "Add note"
    Then I see the validation message "Note text is required" identified by "note-error"
    And no note is added to the notes list
