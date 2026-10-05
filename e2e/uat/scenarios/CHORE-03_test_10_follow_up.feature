Feature: CHORE-03 TEST-10 follow-up: known-improvements
  As a maintainer of the Task Notes app
  I want it recorded that the footer's commit token inherits the footer's style under Design Reference NONE
  So that the missing token-level design values are a documented decision, and the footer stays exactly as merged

  Background:
    Given the stack runs via "docker compose up" with the "db", "backend" and "frontend" services started
    And the application is running at "http://localhost:5183"
    And the stack was built with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"

  Scenario: The decision log records the inherited style (criterion 1)
    Given the CHORE-03 branch is checked out
    When I read ".claude/artifacts/CHORE-03/decisions.md"
    Then an entry names the "app-footer-commit" token and Design Reference mode NONE
    And it states the token inherits the footer's style with no token-specific spacing, monospace font or emphasis
    And it states token-specific values are set only when a configured design reference supplies them

  Scenario: The footer renders exactly as merged (criterion 2)
    Given no application, test or configuration file changed on the branch
    When I open "http://localhost:5183"
    Then the element with data-testid "app-footer" reads "Task Notes v0.1.0 · 0123456"

  Scenario: The commit span has no style of its own (edge case)
    Given the landing page is open
    When I inspect the element with data-testid "app-footer-commit"
    Then it has no inline style attribute
    And its computed font size is "14px" and its colour is "rgb(95, 95, 95)"
    And its computed font family and font weight equal those of the element with data-testid "app-footer"
