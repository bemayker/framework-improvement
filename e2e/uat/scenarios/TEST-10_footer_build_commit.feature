Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am talking to

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend was built with the commit "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678"
    And the backend version is "0.1.0"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (a1b2c3d)"
    And the commit is shown in the element identified by "app-commit"

  Scenario: Footer shows no commit while the request is pending or after it fails (criterion 2)
    Given the network is slow or the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And no element identified by "app-commit" is present
    And the footer does not contain "undefined", "null", "unknown" or an error message

  Scenario: Footer shows the version alone when the backend reports no commit (criterion 2, edge case)
    Given the backend was built without a build commit
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And no element identified by "app-commit" is present
    And the footer contains no parentheses and not the word "unknown"

  Scenario: The component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run it
    Then the AppFooter test for the commit being shown passes
    And the AppFooter test for the request being pending passes
    And the AppFooter test for the request failing passes
