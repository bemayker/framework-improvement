Feature: BUG-04 Saving a note twice quickly stores it once

  Background:
    Given the stack is running and the landing page is open at "http://localhost:5183/"
    And the note form "note-form" with field "note-input" and button "note-submit" is visible

  Scenario: A rapid double save stores the note once (criterion 1)
    Given a save request to "/api/notes" stays pending
    When I type a unique note text into "note-input"
    And I click "note-submit"
    And I click "note-submit" again and press Enter in "note-input" while the first save is pending
    And the pending save finishes
    Then exactly one "POST /api/notes" request was sent
    And the text appears exactly once in "note-list"
    And after reloading the page the text still appears exactly once in "note-list"

  Scenario: The save button is disabled while saving and usable again after success (criterion 2)
    Given a save request to "/api/notes" stays pending
    When I type a unique note text into "note-input" and click "note-submit"
    Then "note-submit" is disabled while the save is pending
    When the pending save finishes
    Then the note is listed, "note-input" is empty and "note-submit" is enabled
    When I type a second unique note text and click "note-submit"
    Then the second note is listed as well

  Scenario: The form accepts a retry after a failed save (criterion 2)
    Given the next save request to "/api/notes" fails
    When I type a note text into "note-input" and click "note-submit"
    Then the message "The note could not be saved. Please try again." is shown
    And the text is kept in "note-input"
    And "note-submit" is enabled
    When the saves work again and I click "note-submit"
    Then the note is listed once and the error message is gone

  Scenario: Edge case, saving the same text twice deliberately stores two notes
    When I save a note with the text "BUG-04 same text" and wait until it is listed
    And I save a note with the text "BUG-04 same text" again after the first save finished
    Then "note-list" contains the text "BUG-04 same text" twice
