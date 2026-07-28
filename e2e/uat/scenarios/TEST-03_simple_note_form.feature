Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to add a note and see it saved
  So that I can keep track of what needs doing without losing it on reload

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5173"
    And I have the app open in a browser

  Scenario: Submitting a non-empty note saves it and shows it in the list
    Given the app is open
    When I type "Buy milk" into the note input identified by "note-input"
    And I click the submit button identified by "note-submit"
    Then "Buy milk" appears in the notes list identified by "note-list"
    And the page does not reload

  Scenario: Submitting an empty note is rejected
    Given the app is open
    And the note input identified by "note-input" is empty
    When I click the submit button identified by "note-submit"
    Then I see a validation message identified by "note-error"
    And no note is sent to the server
    And the notes list identified by "note-list" is unchanged

  Scenario: Saved notes persist across a page reload
    Given I have saved the note "Call the dentist"
    When I reload the page
    Then "Call the dentist" is still visible in the notes list identified by "note-list"

  Scenario: Submitting a whitespace-only note is rejected (edge case)
    Given the app is open
    When I type "   " into the note input identified by "note-input"
    And I click the submit button identified by "note-submit"
    Then I see a validation message identified by "note-error"
    And no note is sent to the server
