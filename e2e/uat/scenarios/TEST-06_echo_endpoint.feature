Feature: TEST-06 Echo endpoint
  As a client of the Task Notes API
  I want GET /api/echo to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the endpoint needs no database, so the "db" service state does not affect it

  Scenario: A supplied message is echoed back with 200
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body is exactly {"echo": "hello"}

  Scenario: A missing msg parameter answers 422 with the standard validation body
    Given the backend is running
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body carries a "detail" array
    And the first entry of that array has "loc" equal to ["query", "msg"]
    And the first entry of that array has "type" equal to "missing"
    And the response is neither a 500 nor an empty 200

  Scenario: A msg longer than 200 characters answers 422 from a bound declared in the schema
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the first entry of the "detail" array has "type" equal to "string_too_long"
    And the first entry of the "detail" array has "loc" equal to ["query", "msg"]
    And the OpenAPI document at "/openapi.json" declares the "msg" query parameter of "/api/echo" as required
    And that parameter's schema declares "maxLength" 200
    And the handler in backend/app/routers/echo.py contains no length comparison and no HTTPException

  Scenario: The response body is declared by the EchoResponse Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the 200 response of "/api/echo" references the component schema "EchoResponse"
    And "components.schemas.EchoResponse" exists with a property "echo" of type "string"
    And backend/app/schemas/echo.py defines EchoResponse as a Pydantic BaseModel with the single field "echo"
    And the router returns EchoResponse(echo=msg) rather than a dict literal

  Scenario: A msg of exactly 200 characters is echoed back with 200 (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" is the same 200-character string that was sent
    And the string is returned verbatim, with no trimming
