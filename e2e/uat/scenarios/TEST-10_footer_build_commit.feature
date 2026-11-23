Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am talking to

  Background:
    Given the backend is running at "http://localhost:8010" with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given "http://localhost:8010/api/version" answers a version and the commit "0123456789ab"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by the backend version, a space and "(0123456)"
    And the footer does not show the characters of the commit after the seventh

  Scenario: Footer follows the commit the real backend reports (criterion 1)
    Given I recreated the backend with "BUILD_COMMIT" set to "abc1234"
    When I reload "http://localhost:5183/"
    Then the footer reads "Task Notes v" followed by the backend version, a space and "(abc1234)"

  Scenario: Footer shows the version alone while the version request is pending (criterion 2)
    Given the browser network is throttled to "Slow 3G"
    When I reload "http://localhost:5183/"
    Then the footer reads exactly "Task Notes" while the version request is pending
    And once the request completes the footer reads "Task Notes v" followed by the backend version and the 7-character commit in parentheses

  Scenario: Footer shows the version alone when the version request fails (criterion 2)
    Given the "api/version" request URL is blocked in the browser
    When I reload "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And the footer text does not contain "undefined", "null", "unknown" or an error message

  Scenario: Footer shows the version alone when the backend reports the unknown commit (criterion 2, edge case)
    Given I recreated the backend with "BUILD_COMMIT" empty, so "/api/version" answers the commit "unknown"
    When I reload "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v" followed by the backend version
    And the footer shows no parentheses and does not contain "unknown"

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    When I run the AppFooter component tests with "npm --prefix frontend test -- src/components/AppFooter.test.tsx"
    Then the run reports no failed or errored test
    And the command exits 0
