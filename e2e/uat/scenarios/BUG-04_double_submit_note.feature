Feature: BUG-04 Saving a note twice quickly stores it twice
  As a user of the Task Notes app
  I want a quick second submit of the note form to be ignored while the first save is still running
  So that one note I meant to save is stored once

  Background:
    Given the Task Notes application is running at "http://localhost:5183"
    And the landing page shows the note form identified by "note-form" and the notes list identified by "note-list"

  Scenario: A double submit while the save is in flight stores one note
    Given the landing page is open
    And the network is throttled so a save stays in flight long enough to submit twice
    When I type "Buy milk twice-test" into the note field identified by "note-input"
    And I double-click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And "Buy milk twice-test" is shown once in the notes list identified by "note-list"
    And after reloading the page "Buy milk twice-test" is still listed exactly once

  Scenario: Pressing Enter and then clicking Save sends one request
    Given the landing page is open
    And the network is throttled so a save stays in flight long enough to submit twice
    When I type "Walk dog enter-test" into the note field identified by "note-input"
    And I press Enter in the field and immediately click the save button identified by "note-submit"
    Then exactly one save request is sent to the backend
    And "Walk dog enter-test" is shown once in the notes list identified by "note-list"

  Scenario: The save button is disabled while saving and enabled afterwards
    Given the landing page is open
    When I type "Call the plumber" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" once
    Then the save button is disabled and clicking it does nothing while the save is pending
    And when the save completes "Call the plumber" is shown in the notes list
    And the note field is empty
    And the save button is enabled again

  Scenario: A failed save keeps the text and allows exactly one retry
    Given the landing page is open
    And the backend is stopped
    When I type "Pay rent" into the note field identified by "note-input"
    And I click the save button identified by "note-submit"
    Then I see the message "The note could not be saved. Please try again."
    And the note field still holds "Pay rent"
    And the save button is enabled
    When the backend is started again
    And I click the save button identified by "note-submit" once
    Then exactly one new save request is sent to the backend
    And "Pay rent" is shown once in the notes list
    And the error message is gone

  Scenario: Saving the same text deliberately twice after the first save completed stores two notes (edge case)
    Given the landing page is open
    When I type "Water plants" into the note field identified by "note-input"
    And I click the save button identified by "note-submit" and wait until the note appears in the list
    And I type "Water plants" into the note field again
    And I click the save button identified by "note-submit" and wait until the second entry appears
    Then "Water plants" is shown twice in the notes list identified by "note-list"

  Scenario: An empty submit does not lock the button (edge case)
    Given the landing page is open
    And the note field identified by "note-input" is empty
    When I click the save button identified by "note-submit"
    Then I see the message "Enter a note before saving."
    And the save button is still enabled
