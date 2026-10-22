Feature: TEST-08 Footer shows the app version
  As someone looking at a running Task Notes instance
  I want the landing page footer to show the backend's version
  So that I can tell which build I am on

  Background:
    Given the Task Notes backend is running at "http://localhost:8010"
    And the frontend is running at "http://localhost:5183"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given "http://localhost:8010/api/version" answers with a version
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: Version comes from the backend, not the frontend package (criterion 2)
    Given the frontend package version is "0.0.0"
    And the backend version in backend/pyproject.toml is "0.1.0"
    When I open "http://localhost:5183/"
    Then the footer shows "0.1.0"
    And the footer does not show "0.0.0"
    And the footer component contains no typed version string

  Scenario: Footer omits the version when the backend is unreachable (criterion 3, edge case)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the landing page still renders its heading and note form
    And the footer reads exactly "Task Notes"
    And the footer shows no "v", no trailing space, and none of "undefined", "null" or "unknown"

  Scenario: Footer shows only the name while the version is loading (criterion 3)
    Given the request to "/api/version" is slow
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes" until the request completes
    And the footer then reads "Task Notes v" followed by the backend version

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter tests
    Then they pass with 0 failed
    And they include a version-present case and version-absent cases
