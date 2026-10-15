import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { version } from "../../package.json";

describe("AppFooter", () => {
  it("renders the application name", () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version imported from package.json", () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent(version);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
