Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I know exactly which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer shows the first 7 characters of the commit next to the version
    Given the backend reports version "0.1.0" and commit "0123456789ab" at "/api/version"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (0123456)"
    And the element identified by "app-footer-commit" reads "(0123456)"
    And the browser made at least one "GET /api/version" request that returned status 200

  Scenario: Footer shows the version alone while the request is pending or after it fails
    Given the version request is slow or blocked so "/api/version" does not answer
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or any parentheses
    And no element identified by "app-footer-commit" exists

  Scenario: Footer shows the version alone when the backend has no commit (edge case)
    Given the backend reports version "0.1.0" and commit "unknown"
    When I open the landing page
    Then the footer reads "Task Notes v0.1.0"
    And the footer does not contain "(unknown)"
    And no element identified by "app-footer-commit" exists

  Scenario: Success, pending and failure paths are covered by a component test
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a test for the success path with a commit passes
    And a test for the pending path passes
    And a test for the failure path passes
