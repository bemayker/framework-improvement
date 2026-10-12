Feature: TEST-01 Static landing page
  As a visitor of the Task Notes app
  I want to see a landing page when I open the site
  So that I know the app is running and identifies itself correctly

  Background:
    Given the Task Notes project infrastructure (frontend, backend, database) is set up per docker-compose.yml
    And the application is running at "http://localhost:5173"

  Scenario: Landing page displays the app title
    Given the app is running
    When I open "http://localhost:5173" in a browser
    Then I see the landing page container identified by "landing-page"
    And I see the title identified by "landing-title" with the text "Task Notes"

  Scenario: Project structure, test infrastructure, and Docker Compose are in place
    Given the repository is checked out
    When I run "docker compose up" from the repository root
    Then the "db", "backend", and "frontend" services start successfully
    And running the backend unit and integration test suites completes green or as a clean no-op
    And running the frontend test suite completes green
    And running the E2E test suite completes green

  Scenario: Landing page renders on direct navigation (edge case)
    Given the app is running
    When I navigate directly to "http://localhost:5173" via a fresh browser tab (not following an internal link)
    Then the landing page loads immediately without requiring a prior navigation step
    And I see the title identified by "landing-title" with the text "Task Notes"
