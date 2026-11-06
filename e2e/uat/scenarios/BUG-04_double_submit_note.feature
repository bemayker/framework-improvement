Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a fast double click on "Save note" to save my note only once
  So that my notes list does not fill up with duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Double-clicking Save note stores the note exactly once
    Given the landing page is open
    When I type "Double click check 1" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then "Double click check 1" appears exactly once in the notes list identified by "note-list"
    And exactly one POST request to "/api/notes" was sent
    And after reloading the page "Double click check 1" is still listed exactly once

  Scenario: The Save note button is disabled while a save is in progress
    Given the landing page is open
    And the network is slow enough that a save stays pending for a few seconds
    When I type "Slow save check" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then the save button identified by "note-submit" is disabled while the request is pending
    And clicking it again or pressing Enter in the field sends no second request
    And once the save finishes "Slow save check" appears exactly once and the button is enabled again

  Scenario: The form accepts a new note after a save finishes
    Given I just saved the note "First after fix"
    When I type "Second after fix" and click the save button identified by "note-submit"
    Then "Second after fix" is saved and appears once in the notes list

  Scenario: After a failed save the text is kept and saving can be retried (edge case)
    Given the backend rejects or cannot be reached for the next save
    When I type "Failure check" and click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And "Failure check" stays in the note field and the save button is enabled again
    And once the backend works again, clicking save stores "Failure check" exactly once and the message disappears

  Scenario: Pressing Enter right after clicking Save note sends no second request (edge case)
    Given the landing page is open
    And the network is slow enough that a save stays pending for a few seconds
    When I type "Enter after click" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    And I press Enter in the note field while the save is still pending
    Then exactly one POST request to "/api/notes" was sent
    And "Enter after click" appears exactly once in the notes list
