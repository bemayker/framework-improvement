Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend's version (criterion 1)
    Given the backend reports a version at "/api/version"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version
    And the version is shown inside the element identified by "app-footer-version"

  Scenario: The version comes from the backend at runtime, not from the frontend package (criterion 2)
    Given the "version" field of frontend/package.json differs from the "version" field of backend/pyproject.toml
    When I open the landing page
    Then the footer shows the backend's version
    And the footer does not show the frontend package's version
    And the browser made one request to "/api/version" on the backend

  Scenario: Footer reads "Task Notes" alone while the version is unresolved (criterion 3)
    Given the backend's version endpoint is unreachable
    When I open the landing page
    Then the footer identified by "app-footer" reads exactly "Task Notes"
    And the element identified by "app-footer-version" is absent
    And the footer shows no "undefined", "null", "unknown" or dangling "v"

  Scenario: A component test asserts both paths (criterion 4)
    Given the frontend test suite
    When I run the tests in src/components/AppFooter.test.tsx and src/api/version.test.ts
    Then the run reports 0 failed
    And the AppFooter tests include a version-present test and version-absent tests for pending, rejected and null results

  Scenario: Backend recovers after being unreachable (edge case)
    Given the backend was stopped and the footer reads "Task Notes"
    When the backend is started again and I reload the landing page
    Then the footer reads "Task Notes v" followed by the backend's version
