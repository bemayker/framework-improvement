Feature: TEST-08 Footer shows the app version from the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the running backend reports
  So that I can tell which build I am on, even when the frontend was built against another backend

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given the backend reports version "0.1.0" at "GET /api/version"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the component (criterion 2)
    Given the backend reports version "0.1.0" at "GET /api/version"
    When I open the landing page with the browser's network inspector open
    Then one request to "http://localhost:8010/api/version" answers with status 200
    And the footer shows the same version as that response
    And the source of the footer component contains no package.json import and no version literal

  Scenario: Footer renders without a version it cannot resolve (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it shows no "v", no "undefined", no "null", no "unknown" and no gap after the name

  Scenario: Component tests cover both the present and the absent version (criterion 4)
    Given the frontend test suite
    When I run it
    Then the AppFooter tests for a present version and for an absent version pass

  Scenario: Backend version wins over the frontend's own package version (criterion 5)
    Given the frontend package declares version "0.0.0"
    And the backend declares version "0.1.0"
    When I open the landing page
    Then the footer shows "0.1.0"
    And it does not show "v0.0.0"

  Scenario: Loading and failure states show the app name alone (criterion 6)
    Given the version request is slow or blocked
    When I look at the footer before the request completes, or after it has failed
    Then the footer reads "Task Notes" with nothing after it
    And once a slow request completes, the footer changes to "Task Notes v0.1.0"

  Scenario: Backend reports no usable version (edge case)
    Given the backend answers "GET /api/version" with the version "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not show the word "unknown"
