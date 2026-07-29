Feature: TEST-03 Simple note form
  As a user of the Task Notes app
  I want to write a note on the landing page and see my saved notes
  So that I can keep track of what needs doing and find it again later

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And I have opened the landing page at "http://localhost:5173"
    And the note form identified by "note-form" is visible

  Scenario: A submitted note is saved and appears in the list right away
    Given the note field is empty
    When I write "Buy milk" in the note field and submit it
    Then "Buy milk" is shown in the notes list identified by "note-list"
    And the notes list is updated in place, without the page reloading
    And the note field is empty again, ready for the next note

  Scenario: Submitting an empty note is refused with a visible message
    Given the note field is empty
    When I submit the form without writing anything
    Then a validation message identified by "note-validation-error" asks me to enter a note first
    And no note is added to the notes list
    And nothing is stored, so the message is the only thing that changes on the page

  Scenario: Saved notes are still there after a reload
    Given I have saved the note "Walk the dog"
    When I reload the page, or open it again in a new browser tab
    Then "Walk the dog" is still listed in the notes list
    And the list comes from the notes the backend stored in PostgreSQL, not from anything the browser kept

  Scenario: A note consisting only of spaces is refused (edge case)
    Given the note field contains only spaces
    When I submit the form
    Then the same validation message identified by "note-validation-error" is shown
    And no blank note appears in the notes list
