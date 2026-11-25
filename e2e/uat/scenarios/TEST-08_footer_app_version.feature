Feature: TEST-08 Footer shows the app version
  As someone looking at a running Task Notes instance
  I want the footer to show the version the backend reports
  So that I can tell which build I am on

  Background:
    Given the stack is running with the frontend at "http://localhost:5183" and the backend at "http://localhost:8010"
    And "GET http://localhost:8010/api/version" answers 200 with a "version" such as "0.1.0"
    And the "version" field of frontend/package.json is "0.0.0"

  Scenario: Footer renders the version on the landing page (criterion 1)
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by the version from "GET /api/version"

  Scenario: The version comes from the backend at runtime (criterion 2)
    When I open "http://localhost:5183/" and read the footer
    Then the footer shows the backend version, not "0.0.0" from frontend/package.json
    And the browser made one "GET /api/version" request that answered 200
    And frontend/src/components/AppFooter.tsx contains neither "package.json" nor a typed version string

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3, edge case)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the page still renders
    And the footer reads exactly "Task Notes"
    And the footer shows no "v", "undefined", "null", "unknown" or trailing gap
    And the element identified by "app-version" is absent

  Scenario: A component test covers both paths (criterion 4)
    When I run the AppFooter and version client tests
    Then they pass
    And the AppFooter tests include a version-present test and a version-absent test

  Scenario: Footer shows the name only until the version arrives (criterion 5)
    Given the network is throttled to a slow connection
    When I open "http://localhost:5183/"
    Then the footer first reads exactly "Task Notes" with no version and no placeholder
    And once the "/api/version" request completes the footer reads "Task Notes v" followed by the backend version
