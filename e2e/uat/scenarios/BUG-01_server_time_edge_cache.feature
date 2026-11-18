Feature: BUG-01 Server time is never served from an edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell caches not to store its response
  So that every request on the deployed environment returns the current server time

  Background:
    Given the Task Notes backend is running
    And the API is reachable at "http://localhost:8000"

  Scenario: The response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with the explicit offset "+00:00"

  Scenario: Two requests a second apart return different times
    When a client sends a GET request to "/api/time"
    And the client waits 1 second
    And the client sends a second GET request to "/api/time"
    Then both responses carry the header "Cache-Control" with the value "no-store"
    And the "now" value of the second response differs from the "now" value of the first

  Scenario: Other methods are not allowed on the route (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405

  Scenario: The deployed environment no longer serves a stored copy (manual, deployed host only)
    Given the change is merged and deployed
    And the API is reachable through the CDN at the deployed host
    When a client sends a GET request to "/api/time" through the CDN
    And the client waits 1 second
    And the client sends a second GET request to "/api/time" through the CDN
    Then the response carries the header "Cache-Control" with the value "no-store"
    And the two "now" values differ
