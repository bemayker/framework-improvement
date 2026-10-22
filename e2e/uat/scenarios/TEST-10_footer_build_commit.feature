Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build of the backend I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is reachable at "http://localhost:5183"
    And the backend is reachable at "http://localhost:8010"

  Scenario: Footer shows the 7-character commit next to the version (criterion 1)
    Given the backend reports commit "0123456789ab" and version "0.1.0" at "GET /api/version"
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the commit shown is the first 7 characters of the reported commit

  Scenario: Version alone while the request is pending or has failed (criterion 2)
    Given the version request has not answered yet or has failed
    When the footer renders
    Then the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null", "unknown" or error text

  Scenario: A frontend component test covers success, pending and failure (criterion 3)
    Given the frontend unit suite
    When I run the AppFooter tests
    Then a success test, a pending test and a failure test pass
    And the run reports 0 failed

  Scenario: A backend without a build commit renders the version alone (edge case)
    Given the backend reports commit "unknown" and version "0.1.0"
    When I open the landing page
    Then the footer reads exactly "Task Notes v0.1.0"
    And the footer shows no "(unknown)", no "()" and no "undefined"
