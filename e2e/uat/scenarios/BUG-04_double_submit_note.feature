Feature: BUG-04 Saving a note twice quickly stores it twice

  Background:
    Given the app stack is running
    And I open the landing page at "/"

  Scenario: Double-clicking Save note stores the note only once
    When I type "Double click check" in the field "note-input"
    And I double-click the button "note-submit" as fast as possible
    Then exactly one POST request to "/api/notes" is sent
    And the text "Double click check" appears exactly once in the saved notes list
    When I reload the page
    Then the text "Double click check" is still listed exactly once

  Scenario: Save note is disabled while a save is in progress and enabled again afterwards
    Given the network is throttled so the save stays pending
    When I type "Disabled state check" in the field "note-input"
    And I click the button "note-submit" once
    Then the button "note-submit" is disabled while the request is pending
    When the request finishes
    Then the button "note-submit" is enabled again
    And the text "Disabled state check" is listed exactly once

  Scenario: A second distinct note can be saved right after the first
    Given I have saved the note "First distinct note"
    When I type "Second distinct note" in the field "note-input"
    And I click the button "note-submit" once
    Then "First distinct note" is listed exactly once
    And "Second distinct note" is listed exactly once

  Scenario: A failed save re-enables the button so the note can be retried
    Given the network is offline
    When I type "Offline retry check" in the field "note-input"
    And I click the button "note-submit" once
    Then an error message tells me the note could not be saved
    And the text "Offline retry check" stays in the field
    And the button "note-submit" is enabled
    When the network is restored
    And I click the button "note-submit" once
    Then "Offline retry check" is listed exactly once
