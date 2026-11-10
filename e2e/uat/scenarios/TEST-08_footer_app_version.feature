Feature: TEST-08 Footer shows the backend app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the running backend
  So that I know which build I am talking to, even when the frontend was built against an older backend

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer shows the backend version fetched at runtime
    Given "http://localhost:8010/api/version" answers with the backend version
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that backend version
    And the footer does not show the version from frontend/package.json when it differs
    And the browser made one request to "/api/version" that answered 200

  Scenario: Footer version comes from the backend package metadata only
    Given the backend version is declared in backend/pyproject.toml and served by "GET /api/version"
    When I change that version and restart only the backend, leaving the frontend untouched
    And I reload "http://localhost:5183"
    Then the footer shows the new backend version
    And the footer component contains no version literal and no frontend/package.json import

  Scenario: Footer omits the version when the backend is unreachable (edge case)
    Given the backend is stopped, so "/api/version" cannot be reached
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" is still visible
    And the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null" or "unknown"
    And there is no trailing " v" or empty gap after the app name

  Scenario: Footer shows the app name alone while the version is loading
    Given the network is throttled so "/api/version" stays pending
    When I open "http://localhost:5183"
    Then the footer reads exactly "Task Notes" until the response arrives
    And once the response arrives the footer reads "Task Notes v" followed by the backend version

  Scenario: Component tests cover both the present and the absent version
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And one test shows the version when the client resolves it
    And other tests show only "Task Notes" when the client rejects or resolves nothing
