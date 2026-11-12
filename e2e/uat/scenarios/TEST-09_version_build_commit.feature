Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with string fields version and commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the keys "version" and "commit"
    And both fields are strings

  Scenario: A backend image built with a full sha reports its first 12 characters
    Given the backend image was built with BUILD_COMMIT "3f9c2a71b0de4c5e8a9f00112233445566778899"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9c2a71b0de"
    And no commit string is typed into the router; the value comes from the BUILD_COMMIT environment variable

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the "VersionResponse" schema lists "version" and "commit" as properties of type string
    And both properties are required

  Scenario: A backend image built without BUILD_COMMIT reports unknown
    Given the backend image was built without BUILD_COMMIT
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: A short commit value is returned unchanged (edge case)
    Given the backend image was built with BUILD_COMMIT "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the value is neither padded nor altered
