Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given the backend answers "GET /api/version" with {"version": "0.1.0"}
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"
    And the element identified by "app-footer-version" reads "v0.1.0"

  Scenario: Version comes from the backend at runtime, not from the frontend (criterion 2)
    Given the frontend package.json version is "0.0.0"
    And the backend reports version "0.1.0"
    When I open "http://localhost:5183/" and watch the network requests
    Then one request to "http://localhost:8010/api/version" returns status 200
    And the footer shows "v0.1.0" and not "v0.0.0"
    And AppFooter.tsx contains no version literal and no package.json import

  Scenario: Footer renders without a version when the backend is unreachable (criterion 3, edge case)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And the footer contains none of "undefined", "null" or "unknown"
    And no element identified by "app-footer-version" is present
    And the heading and note form still render

  Scenario: Footer recovers once the backend is back (criterion 3)
    Given the backend was stopped and the footer read "Task Notes"
    When I start the backend again and reload "http://localhost:5183/"
    Then the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a version-present test passes
    And version-absent tests (client rejects, client returns null) pass
    And 0 tests fail
