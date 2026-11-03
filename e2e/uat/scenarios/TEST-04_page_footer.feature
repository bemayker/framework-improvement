Feature: TEST-04 Page footer with app version
  As a visitor of the Task Notes app
  I want to see a footer identifying the app and its deployed version
  So that I know which build of the app I am looking at

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5173"

  Scenario: Footer shows the app name and the deployed version
    Given the app is running
    When I open "http://localhost:5173" in a browser
    Then I see a footer identified by "app-footer" at the bottom of the page
    And the footer shows "Task Notes" and a version number
    And that version number matches the "version" field of frontend/package.json

  Scenario: Footer is announced as a landmark, not as plain text
    Given the landing page is open
    When I inspect the page with a screen reader or the browser's accessibility inspector
    Then the footer is announced as a "contentinfo" landmark
    And it is identified by the test attribute "app-footer"

  Scenario: Existing heading and subtitle are unchanged
    Given I know what the landing page looked like before this feature
    When I open the landing page after this feature was added
    Then the title identified by "landing-title" still reads "Task Notes"
    And the subtitle describing the app is still present, worded exactly as before
    And the only visible addition is the new footer

  Scenario: Footer remains readable on a phone-sized screen (edge case)
    Given I open the app on a phone-sized screen
    When the landing page loads
    Then the footer with the app name and version is still visible
    And it is not cut off or overlapping the rest of the page
