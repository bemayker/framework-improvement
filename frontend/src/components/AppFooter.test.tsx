import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchVersion: vi.fn(),
}));

const fetchVersionMock = vi.mocked(fetchVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchVersionMock.mockReset();
    fetchVersionMock.mockResolvedValue("9.9.9-test");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    await screen.findByTestId("app-footer-version");
  });

  it("renders the resolved version when it is present", async () => {
    render(<AppFooter />);

    const version = await screen.findByTestId("app-footer-version");
    expect(version).toHaveTextContent("v9.9.9-test");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v9.9.9-test",
    );
  });

  it("renders the app name alone when the version cannot be resolved", async () => {
    fetchVersionMock.mockRejectedValue(new Error("unreachable"));

    render(<AppFooter />);
    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    // Let the rejection settle before asserting the absent path.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(footer).not.toHaveTextContent(/undefined|null/);
  });

  it("renders the app name alone while the version is loading", () => {
    fetchVersionMock.mockReturnValue(new Promise(() => undefined));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("fetches the version exactly once per mount", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
