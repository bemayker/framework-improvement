Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to write a note and see it kept in a list
  So that what I need to do is recorded and still there when I come back

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running per docker-compose.yml
    And the application is open at "http://localhost:5173"

  Scenario: A note I write is saved and appears in my list straight away
    Given the landing page is open with the note form on it
    When I type "Buy milk" into the note field and choose "Add note"
    Then "Buy milk" is listed under the form
    And the note field is empty again, ready for the next note
    And the page never reloaded while the note was being added

  Scenario: An empty note is refused and nothing is stored
    Given the landing page is open with the note field empty
    When I choose "Add note" without typing anything
    Then the message "Enter a note before adding it." is shown, identified by "note-validation-error"
    And the notes list is unchanged, with no blank entry added

  Scenario: Notes I saved earlier are still listed after a reload
    Given I have saved the note "Buy milk"
    When I reload the page in the browser
    Then "Buy milk" is still listed
    And it is listed because it was read back from the database, not remembered by the browser

  Scenario: A note of only spaces is refused like an empty one (edge case)
    Given the landing page is open
    When I type three spaces into the note field and choose "Add note"
    Then the message "Enter a note before adding it." is shown, identified by "note-validation-error"
    And the spaces I typed are still in the field, so nothing I wrote was thrown away
    And no note of only spaces is listed

  Scenario: An over-long note is refused with a save message, not silently dropped (edge case)
    Given the landing page is open
    And a note longer than 1000 characters, which is the limit the backend accepts
    When I paste that text into the note field and choose "Add note"
    Then the message "The note could not be saved. Please try again." is shown, identified by "note-save-error"
    And the over-long text is still in the field so I can shorten it
    And the over-long note is not listed, before or after a reload
