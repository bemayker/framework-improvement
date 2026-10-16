Feature: TEST-09 Version endpoint reports the build commit
  GET /api/version tells a client which build it is talking to: the application
  version and the commit the image was built from. There is no UI for this
  endpoint, so the steps are HTTP requests and responses.

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - the endpoint returns 200 with version and commit strings
    When I request GET /api/version
    Then the status is 200
    And the JSON body has exactly the keys version and commit
    And version is a JSON string
    And commit is a JSON string

  Scenario: Criterion 2 - commit is unknown when the image was built without BUILD_COMMIT
    Given the backend image was built without BUILD_COMMIT exported
    When I request GET /api/version
    Then commit is unknown

  Scenario: Criterion 2 - commit comes from BUILD_COMMIT set at build time
    Given the backend image was built with BUILD_COMMIT set to abc1234
    When I request GET /api/version
    Then commit is abc1234
    And version is unchanged

  Scenario: Criterion 2 edge - a 40-character sha is cut to its first 12 characters
    Given the backend image was built with BUILD_COMMIT set to 0123456789abcdef0123456789abcdef01234567
    When I request GET /api/version
    Then commit is 0123456789ab
    And version is unchanged

  Scenario: Criterion 2 - no commit string is typed into the router
    When I read backend/app/routers/version.py
    Then it contains no commit literal
    And the value arrives through get_build_commit in backend/app/services/version_service.py

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When I read the OpenAPI document at http://localhost:8010/openapi.json
    Then GET /api/version responds with the schema VersionResponse
    And VersionResponse has the string properties version and commit

  Scenario: Criterion 4 - the set and unset commit paths are covered by tests
    When I run uv run --directory backend pytest -q tests/unit/test_config_unit.py tests/unit/test_version_service_unit.py tests/integration/test_version_integration.py
    Then the summary line reports 0 failed
