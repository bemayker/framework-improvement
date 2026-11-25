Feature: TEST-10 Footer shows the build commit
  As someone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the stack is running with the frontend at "http://localhost:5183" and the backend at "http://localhost:8010"
    And the backend was built with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    And "GET http://localhost:8010/api/version" answers 200 with "version" "0.1.0" and "commit" "0123456789ab"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-commit" holds "(0123456)"
    And the element identified by "app-version" still holds exactly "v0.1.0"
    And the footer does not show the full commit "0123456789ab"

  Scenario: Footer shows the name alone while the request is pending (criterion 2)
    Given the network is throttled to a slow connection
    When I open "http://localhost:5183/"
    Then the footer first reads exactly "Task Notes" with no "undefined", no "(" and no error text
    And once the "/api/version" request completes the footer reads "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows the name alone when the request fails (criterion 2)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the page still renders
    And the footer reads exactly "Task Notes"
    And the footer shows no "v", "(", "undefined", "null", "unknown" or error text
    And the elements identified by "app-version" and "app-commit" are absent

  Scenario: Footer shows the version alone when the backend has no usable commit (criterion 2, edge case)
    Given the backend was built without BUILD_COMMIT
    And "GET http://localhost:8010/api/version" answers 200 with "commit" "unknown"
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes v0.1.0"
    And the element identified by "app-commit" is absent
    And the footer shows no "(", "unknown", "undefined" or "null"

  Scenario: A component test covers the success, pending and failure paths (criterion 3)
    When I run the AppFooter, version client and LandingPage tests
    Then they pass
    And the AppFooter tests include a success test, a pending test and a failure test
