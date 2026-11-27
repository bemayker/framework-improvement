Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can match a running backend to the commit it was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit string
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the string fields "version" and "commit"

  Scenario: A backend built with a full 40-character sha reports its first 12 characters
    Given the backend was built with BUILD_COMMIT "3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9a1c2b7d4e"

  Scenario: A backend built with a short commit reports it unchanged (edge case)
    Given the backend was built with BUILD_COMMIT "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A backend built without BUILD_COMMIT reports unknown
    Given the backend was built with BUILD_COMMIT unset or blank
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is described by a Pydantic schema
    Given the backend is running
    When a client opens "/openapi.json"
    Then the "VersionResponse" schema lists "version" and "commit" as required string properties
