Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a quick double submit to save my note only once
  So that my list does not fill with duplicates

  Background:
    Given the Task Notes application (frontend, backend, database) is running
    And the application is open at "http://localhost:5183"
    And the note form is identified by "note-form" and the save button by "note-submit"

  Scenario: A quick double submit stores one note
    Given the network is throttled so a save takes a moment
    When I type "Double click test" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" twice in quick succession
    Then exactly one request to "/api/notes" is sent
    And exactly one "Double click test" entry is shown in the notes list identified by "note-list"
    And after I reload the page it is still listed exactly once

  Scenario: The save button is disabled while the save is in flight
    Given the network is throttled so a save takes a moment
    When I type "Disabled state test" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then the save button is disabled while the request is pending
    And once the note appears in the list the save button is enabled again

  Scenario: The form can be used again after a failed save
    Given the backend is stopped
    When I type "Retry after failure" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the text is still in the note field and the save button is enabled
    When the backend is started again
    And I click the save button identified by "note-submit"
    Then the error message disappears
    And "Retry after failure" is shown once in the notes list

  Scenario: An empty note is still refused (edge case)
    Given the note field identified by "note-input" is empty
    When I click the save button identified by "note-submit"
    Then I see the validation message identified by "note-form-error"
    And no request to "/api/notes" is sent
    And the save button remains enabled
