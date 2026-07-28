import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { version } from "../../package.json";

describe("LandingPage", () => {
  it("renders the app title 'Task Notes'", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-title")).toHaveTextContent("Task Notes");
  });

  it("renders the landing page container", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  it("renders the title as a heading for accessibility", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Task Notes" })).toBeInTheDocument();
  });

  it("renders the footer with the app name and version", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(version);
  });
});
