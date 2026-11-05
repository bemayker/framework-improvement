Feature: TEST-10 Footer shows the build commit
  As anyone looking at a running Task Notes instance
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am on

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend runs with BUILD_COMMIT "3f2a9c1d4e5b6a7b"
    And "GET /api/version" answers {"version": "0.1.0", "commit": "3f2a9c1d4e5b"}
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (3f2a9c1)"

  Scenario: A pending or failed version request shows no commit and no error (criterion 2)
    Given the "/api/version" request is blocked or still pending
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer shows no "undefined", no "null", no "unknown", no "()" and no error text

  Scenario: A component test covers the success, pending and failure paths (criterion 3)
    Given the frontend unit suite
    When I run "npm --prefix frontend test"
    Then the AppFooter tests for success, pending and failure pass

  Scenario: Backend reports the unknown commit (edge case)
    Given the backend runs with BUILD_COMMIT unset
    And "GET /api/version" answers {"version": "0.1.0", "commit": "unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And it shows no parentheses and no "unknown"
