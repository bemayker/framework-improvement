Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend was built with BUILD_COMMIT 0123456789abcdef0123456789abcdef01234567
    And "GET /api/version" answers 200 with {"version":"0.1.0","commit":"0123456789ab"}
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows the version alone while the request is pending or when it fails (criterion 2)
    Given the backend answers slowly
    When the landing page first renders
    Then the footer reads exactly "Task Notes" with no placeholder
    And once the request completes the footer shows the version and the commit
    When the backend is stopped and I reload the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "undefined", "null", "unknown", empty parentheses or error text

  Scenario: Component tests cover the success, pending and failure paths (criterion 3)
    Given the frontend test suite
    When I run the AppFooter tests
    Then the success, pending and failure cases pass

  Scenario: Backend reports the unknown commit (edge case)
    Given the backend was built without BUILD_COMMIT
    And "GET /api/version" answers 200 with {"version":"0.1.0","commit":"unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And it shows no parentheses and no "unknown"
