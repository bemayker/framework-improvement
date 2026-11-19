Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes frontend is running at "http://localhost:5183"
    And the backend is running and answers "GET /api/version"

  Scenario: Footer renders the version on the landing page
    Given "backend/pyproject.toml" declares the version "0.1.0"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the frontend bundle
    Given "frontend/package.json" declares a different version than "backend/pyproject.toml"
    When I open "http://localhost:5183" in a browser
    Then the footer shows the version from "backend/pyproject.toml"
    And the footer does not show the version from "frontend/package.json"
    And the browser made a GET request to "/api/version"

  Scenario: The footer renders without a version when it cannot be resolved
    Given the request to "/api/version" is blocked or fails
    When I open "http://localhost:5183" in a browser
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or a lone "v"
    And there is no trailing gap after the name

  Scenario: A component test covers both the version-present and version-absent paths
    Given the frontend test suite is installed
    When I run the "AppFooter" component test
    Then it passes
    And its titles include a version-present case and a version-absent case

  Scenario: The backend cannot be reached at all (edge case)
    Given the backend is stopped
    When I open "http://localhost:5183" in a browser
    Then the landing page still loads
    And the footer is still visible and reads exactly "Task Notes"
