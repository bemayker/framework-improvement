Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a note I save twice in quick succession to be stored once
  So that my list does not fill up with duplicates

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is running
    And the application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: Clicking save twice while the first save is pending stores the note once
    Given the landing page is open
    And a save request takes a couple of seconds to finish
    When I type "BUG-04 double click check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit" twice in quick succession
    Then only one save request is sent to the backend
    And "BUG-04 double click check" is shown exactly once in the notes list identified by "note-list"
    And after I reload the page, "BUG-04 double click check" is still listed exactly once

  Scenario: Pressing Enter again while a save is pending sends no second request
    Given the landing page is open
    And a save request takes a couple of seconds to finish
    When I type "BUG-04 enter check" into the note field identified by "note-input"
    And I press Enter in the note field
    And I press Enter in the note field again while the first save is still pending
    Then only one save request is sent to the backend
    And "BUG-04 enter check" is shown exactly once in the notes list identified by "note-list"

  Scenario: The save button is disabled while saving and enabled again afterwards
    Given the landing page is open
    And a save request takes a couple of seconds to finish
    When I type "BUG-04 disabled check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then the save button identified by "note-submit" is disabled while the save is pending
    And once the save has finished the save button is enabled again
    And "BUG-04 disabled check" is shown in the notes list identified by "note-list"

  Scenario: A failed save can be retried and stores the note once (edge case)
    Given the landing page is open
    And the backend cannot be reached
    When I type "BUG-04 retry check" into the note field identified by "note-input"
    And I press the save button identified by "note-submit"
    Then I see the error message identified by "note-form-error" saying the note could not be saved
    And "BUG-04 retry check" is still in the note field
    And the save button identified by "note-submit" is enabled
    When the backend can be reached again
    And I press the save button identified by "note-submit"
    Then "BUG-04 retry check" is shown exactly once in the notes list identified by "note-list"
    And the note field is empty
