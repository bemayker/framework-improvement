Feature: BUG-04 Saving a note twice quickly stores it once

  Background:
    Given the stack is running and the landing page at "/" is open
    And the note form "note-form" is shown with the "note-input" field and the "note-submit" button

  Scenario: Criterion 1 - a fast double click stores the note once
    Given a save is slow enough to stay pending
    When I type "Double click check 1" into "note-input"
    And I double click "note-submit" quickly
    Then exactly one POST /api/notes request is sent
    And after it finishes "note-list" shows "Double click check 1" exactly once
    And after a reload "note-list" still shows "Double click check 1" exactly once

  Scenario: Criterion 1 - pressing Enter twice quickly stores the note once
    Given a save is slow enough to stay pending
    When I type "Enter key check 1" into "note-input"
    And I press Enter twice quickly
    Then exactly one POST /api/notes request is sent
    And "note-list" shows "Enter key check 1" exactly once

  Scenario: Criterion 2 - the button is disabled while pending and enabled after success
    Given "note-submit" is enabled
    When I type "Pending state check" into "note-input" and click "note-submit" once
    Then while the request is pending "note-submit" is disabled and clicking it sends no second POST
    And after the request finishes "note-list" shows "Pending state check"
    And "note-input" is empty
    And "note-submit" is enabled

  Scenario: Criterion 3 - a failed save re-enables the button and a retry sends one request
    Given the backend is stopped
    When I type "Retry check" into "note-input" and click "note-submit"
    Then "note-form-error" shows "The note could not be saved. Please try again."
    And "note-input" still holds "Retry check"
    And "note-submit" is enabled
    When the backend is started again and I click "note-submit" once
    Then exactly one new POST /api/notes request is sent
    And "note-list" shows "Retry check" once
    And "note-form-error" is gone

  Scenario: Edge case - a second, different note saves normally after the first save
    Given I saved "Pending state check" and "note-submit" is enabled again
    When I type "Second note" into "note-input" and click "note-submit"
    Then one more POST /api/notes request is sent
    And "note-list" shows "Second note" exactly once
