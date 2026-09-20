Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo to return the text I sent it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A msg parameter is echoed back with a 200 response
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: A missing msg parameter answers 422
    Given the backend is running
    When a client sends a GET request to "/api/echo" with no "msg" parameter
    Then the response status code is 422
    And the response body carries a "detail" key describing the missing "msg" query parameter

  Scenario: A msg longer than 200 characters answers 422, with the bound declared on the parameter
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body's "detail" entry names the "msg" query parameter as too long
    And the generated API documentation at "/docs" shows the "msg" parameter with a declared maximum length of 200

  Scenario: The response body is defined by the EchoResponse schema
    Given the backend is running
    When the generated OpenAPI document at "/openapi.json" is inspected
    Then it defines a "EchoResponse" schema with a single string property "echo"
    And the 200 response of "/api/echo" references that schema

  Scenario: A msg of exactly 200 characters is accepted (edge case, the boundary is inclusive)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body echoes all 200 characters of "msg" unchanged
