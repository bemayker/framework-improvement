Feature: BUG-04 Saving a note twice quickly stores it once
  As a user of the Task Notes app
  I want a second submit during a pending save to be ignored
  So that one note is never stored twice

  Background:
    Given the app is open at "http://localhost:5183/"
    And the "New note" field and the "Save note" button are visible

  Scenario: Pressing Enter twice while a save is pending stores the note once (criterion 1)
    Given the network is slow so a save takes a few seconds
    When I type "Double submit check" in the "New note" field
    And I press Enter twice within one second
    Then exactly one "POST /api/notes" request is sent
    And after the save finishes "Double submit check" appears in the note list exactly once
    And the "New note" field is empty
    And after I reload the page "Double submit check" still appears exactly once

  Scenario: Double-clicking Save note while a save is pending stores the note once (criterion 1)
    Given the network is slow so a save takes a few seconds
    When I type "Double click check" in the "New note" field
    And I double-click the "Save note" button
    Then exactly one "POST /api/notes" request is sent
    And after the save finishes "Double click check" appears in the note list exactly once
    And after I reload the page "Double click check" still appears exactly once

  Scenario: The Save note button is disabled while a save is pending (criterion 2)
    Given the network is slow so a save takes a few seconds
    When I type "Disabled button check" in the "New note" field
    And I click the "Save note" button
    Then the "Save note" button is disabled
    And clicking the "Save note" button does nothing
    When the save finishes
    Then the "Save note" button is enabled again
    And "Disabled button check" appears in the note list exactly once

  Scenario: The Save note button is enabled again after a failed save (criterion 2)
    Given the backend is stopped
    When I type "Failure check" in the "New note" field
    And I click the "Save note" button
    Then the "Save note" button is disabled until the request fails
    And the message "The note could not be saved. Please try again." is shown
    And the "Save note" button is enabled again
    And the "New note" field still contains "Failure check"

  Scenario: A new note can be saved after a successful save (criterion 3)
    Given the backend is running and the network is not throttled
    When I save the note "First note"
    And I save the note "Second note"
    Then the note list shows "First note" exactly once
    And the note list shows "Second note" exactly once

  Scenario: The same note can be retried after a failed save (criterion 3, edge case)
    Given the backend is stopped
    And I tried to save the note "Retry note" and the error message is shown
    When I start the backend again
    And I click the "Save note" button again
    Then "Retry note" appears in the note list exactly once
    And the error message is gone
