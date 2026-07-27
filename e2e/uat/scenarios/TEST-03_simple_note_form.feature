Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to add a note through a simple form and see it in a list
  So that I can keep track of things I need to do, even after reloading the page

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5173"
    And I have opened "http://localhost:5173" in a browser

  Scenario: AC1 - Submitting a non-empty note stores it and shows it in the list without a full page reload
    Given the note form identified by "note-form" is visible
    When I type "Buy milk" into the input identified by "note-form-input"
    And I click the button identified by "note-form-submit"
    Then a "POST" request to "/api/notes" is made and returns status 201
    And I see "Buy milk" in the list identified by "note-list"
    And the page did not perform a full reload or navigation

  Scenario: AC2 - Submitting an empty note is rejected with a visible validation message and no API call
    Given the note form identified by "note-form" is visible
    And the input identified by "note-form-input" is empty
    When I click the button identified by "note-form-submit" without typing anything
    Then I see a validation message identified by "note-form-error"
    And no "POST" request to "/api/notes" is made
    And the list identified by "note-list" is not changed

  Scenario: AC3 - Saved notes persist across a page reload
    Given I have saved the note "Call the dentist" via the note form
    And I see "Call the dentist" in the list identified by "note-list"
    When I reload the page
    Then a "GET" request to "/api/notes" is made
    And I still see "Call the dentist" in the list identified by "note-list"

  Scenario: Edge case - Submitting a whitespace-only note is rejected the same way as an empty note
    Given the note form identified by "note-form" is visible
    When I type "   " (three spaces, no visible characters) into the input identified by "note-form-input"
    And I click the button identified by "note-form-submit"
    Then I see a validation message identified by "note-form-error"
    And no "POST" request to "/api/notes" is made
    And the list identified by "note-list" is not changed
