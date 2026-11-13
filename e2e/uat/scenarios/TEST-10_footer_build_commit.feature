Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build of the API I am talking to

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend answers "http://localhost:8010/api/version"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend was started with BUILD_COMMIT "4f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f"
    And "GET /api/version" returns version "0.1.0" and commit "4f2a9c1d8e7b"
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0 (4f2a9c1)"
    And the element identified by "app-footer-commit" reads " (4f2a9c1)"

  Scenario: Footer shows no commit when the version request fails
    Given the backend version endpoint is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or "error"
    And there is no element identified by "app-footer-commit"
    And the rest of the page still renders

  Scenario: Footer shows no commit while the version request is pending
    Given the version request is slow
    When I open the landing page
    Then until the request completes the footer reads exactly "Task Notes"
    And there is no element identified by "app-footer-commit"
    And once the request completes the footer reads "Task Notes v0.1.0 (4f2a9c1)"

  Scenario: Footer shows the version alone when the commit is unknown (edge case)
    Given the backend was started with BUILD_COMMIT unset
    And "GET /api/version" returns commit "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer does not contain "(" or "unknown"
    And there is no element identified by "app-footer-commit"

  Scenario: A component test covers the success, pending and failure paths
    Given the frontend unit suite
    When I run the AppFooter and version client tests
    Then "renders the first 7 characters of the commit next to the version" passes
    And "renders no commit while the version request is pending" passes
    And "renders no commit when the version request fails" passes
    And 0 tests fail
