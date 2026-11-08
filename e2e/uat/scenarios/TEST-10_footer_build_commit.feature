Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend was built with BUILD_COMMIT "a1b2c3d4e5f67890"
    And "/api/version" reports the commit "a1b2c3d4e5f6"
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (a1b2c3d)"
    And the commit is shown inside the element identified by "app-footer-commit"
    And the element identified by "app-footer-commit" does not contain "a1b2c3d4"

  Scenario: Pending or failed request shows no commit, undefined or error (criterion 2)
    Given the backend's version endpoint is unreachable
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes"
    And the element identified by "app-footer-commit" is absent
    And the footer shows no "undefined", "null", "unknown" or error text

  Scenario: A component test covers success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the tests in src/components/AppFooter.test.tsx and src/api/version.test.ts
    Then the run reports 0 failed
    And the AppFooter tests include a success test, a pending test and a failure test

  Scenario: Commit "unknown" shows the version alone (edge case)
    Given the backend was built without BUILD_COMMIT so "/api/version" reports the commit "unknown"
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"
    And the element identified by "app-footer-commit" is absent
    And the footer shows no "(unknown)" and no empty parentheses
