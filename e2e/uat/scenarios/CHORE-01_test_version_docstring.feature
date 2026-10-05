Feature: CHORE-01 Version integration test module docstring names TEST-05 and TEST-09

  Background:
    Given the repository is checked out on branch "feature/CHORE-01-test-09-follow-up"

  Scenario: Module docstring names both items it covers
    When I read line 1 of "backend/tests/integration/test_version_integration.py"
    Then it reads '"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""'

  Scenario: No other line of the file changes
    When I diff "backend/tests/integration/test_version_integration.py" against origin/main
    Then exactly 1 line is removed and exactly 1 line is added
    And the removed line is the docstring naming only "(TEST-05)"
    And the added line is the docstring naming "(TEST-05, TEST-09)"
