Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to write a note on the landing page and see it saved
  So that I can keep track of what needs doing across visits

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5173"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A saved note appears in the list straight away
    Given the landing page is open
    When I type "Buy milk" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then "Buy milk" is shown as an entry of the notes list identified by "note-list"
    And the note field is empty again, ready for the next note
    And no validation message identified by "note-form-error" is shown
    And the page never reloaded while the note was being saved

  Scenario: An empty note is refused with an explanation
    Given the landing page is open
    And the note field identified by "note-input" is empty
    When I press the save button identified by "note-submit"
    Then I see the validation message identified by "note-form-error" telling me to enter a note first
    And nothing was added to the notes list
    And the backend was never contacted, so no note was stored

  Scenario: Saved notes survive closing and reopening the page
    Given I saved the note "Walk the dog" earlier
    When I reload "http://localhost:5173" in the browser
    Then "Walk the dog" is still shown in the notes list identified by "note-list"
    And it is shown because the app read it back from the database, not from anything the browser kept

  Scenario: A note of only spaces counts as empty (edge case)
    Given the landing page is open
    When I type three spaces into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the same validation message identified by "note-form-error" as for a completely empty note
    And the backend was never contacted, so no blank note was stored

  Scenario: A note is accepted up to 500 characters and no further (edge case)
    Given the landing page is open
    When I paste a note of exactly 500 characters into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the 500-character note is saved and shown in the notes list identified by "note-list"
    And when I try to paste 501 characters into the note field, the field keeps only the first 500
