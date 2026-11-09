Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build I am looking at

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version
    Given the backend reports commit "0123456789ab"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0 (0123456)"

  Scenario: Footer shows no commit and no error while the request is pending or after it fails
    Given the version endpoint is unreachable
    When I open the landing page
    Then the footer reads "Task Notes"
    And it shows no "undefined", "null", "(" or error text

  Scenario: Component tests cover the success, pending and failure paths
    Given the frontend test suite
    When I run the AppFooter component test
    Then it reports 0 failed
    And it lists the success, pending and failure cases

  Scenario: Footer shows the version alone when the build commit is unknown (edge case)
    Given the backend has no build commit
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And it shows no parentheses and no "unknown"
