Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build is actually deployed, rather than which one the frontend was packaged from

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the frontend is published on the host at "http://localhost:5183"
    And the backend API is published on the host at "http://localhost:8010"
    And the backend answers GET /api/version with a body of the shape {"version": "<the backend's own version>"}
    And the footer asks that endpoint from the browser when the page loads, never reading frontend/package.json

  Scenario: The footer shows the app name and the version the backend reports
    Given the whole stack is running
    When I open "http://localhost:5183" in a browser
    Then I see a footer identified by "app-footer" at the bottom of the page
    And it reads "Task Notes" followed by "v" and a version number
    And that version number is exactly the "version" field GET /api/version returns
    And the version is carried by an element identified by "app-footer-version"

  Scenario: The version comes from the running backend, not from the frontend bundle
    Given the whole stack is running and the footer shows the backend's version
    When I stop the backend and reload the landing page
    Then no version number is shown anywhere in the footer
    And a version compiled into the frontend bundle would still be showing here, so its absence proves the backend is the source
    When I start the backend again and reload the landing page
    Then the footer shows the backend's version once more

  Scenario: The footer renders without a version when it cannot be resolved
    Given the backend is stopped, so GET /api/version is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes · version unavailable"
    And that message is carried by an element identified by "app-footer-version-unavailable"
    And no element identified by "app-footer-version" exists in the page at all
    And the footer text contains neither "undefined" nor "null", and no dangling "v" with nothing after it

  Scenario: The component test suite asserts both the version-present and the version-absent path
    Given a terminal open in the "frontend" directory of the repository
    When I run the frontend unit test suite
    Then it reports a passing test for the footer with a version present
    And a passing test for the footer with the version absent
    And both drive the footer through a stubbed version client rather than a live backend

  Scenario: While the version request is still in flight the footer shows no version-shaped text (edge case)
    Given GET /api/version has been asked for but has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"
    And neither "app-footer-version" nor "app-footer-version-unavailable" exists in the page yet
    And nothing that could be mistaken for a version is painted from the unresolved value

  Scenario: An answer that is not a usable version is treated as unavailable (edge case)
    Given the backend answers GET /api/version with HTTP 500, or with a body that is not JSON, or with a body that is not {"version": <non-empty string>}, or does not answer within 5 seconds
    When I open the landing page
    Then the footer reads "Task Notes · version unavailable", exactly as it does for an unreachable backend
    And no partial or malformed version string is shown

  Scenario: The backend's own "unknown" sentinel is shown verbatim (edge case)
    Given the backend runs without its distribution metadata installed, so GET /api/version answers {"version": "unknown"}
    When I open the landing page
    Then the footer reads "Task Notes vunknown"
    And it does not read "version unavailable", because the endpoint answered and the footer reports what it said
