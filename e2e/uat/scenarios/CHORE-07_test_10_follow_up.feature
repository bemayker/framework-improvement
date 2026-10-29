Feature: CHORE-07 TEST-08 footer spec passes with and without a build commit
  As a maintainer running the E2E suite on any stack
  I want the TEST-08 footer spec to pass whether or not BUILD_COMMIT is set
  So that the TEST-10 commit suffix no longer breaks the existing version check

  Background:
    Given the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: TEST-08 spec passes with BUILD_COMMIT set (criterion 1)
    Given the stack is running with BUILD_COMMIT set to "3761feee721597797dfabfd75a08d12e7aea4a23"
    And the element identified by "app-footer" reads "Task Notes v0.1.0 (3761fee)"
    When I run the tests in "e2e/tests/TEST-08_footer_app_version.spec.ts"
    Then the run reports 0 failed

  Scenario: TEST-08 spec passes with BUILD_COMMIT unset (criterion 2)
    Given the stack is running with BUILD_COMMIT unset
    And the element identified by "app-footer" reads "Task Notes v0.1.0"
    When I run the tests in "e2e/tests/TEST-08_footer_app_version.spec.ts"
    Then the run reports 0 failed

  Scenario: The first test still verifies the version (criterion 3)
    Given the file "e2e/tests/TEST-08_footer_app_version.spec.ts"
    When I read its first test
    Then it asserts that the element identified by "app-footer" contains "Task Notes v0.1.0"
    And it asserts that the element identified by "app-footer-version" reads exactly "v0.1.0"

  Scenario: The backend-unreachable test is unchanged (criterion 3, edge case)
    Given the file "e2e/tests/TEST-08_footer_app_version.spec.ts"
    When I read its second test
    Then it blocks "**/api/version" and asserts that the element identified by "app-footer" reads exactly "Task Notes"
    And it asserts that no element identified by "app-footer-version" is present
    And "git diff main" for that file shows no change inside the second test
