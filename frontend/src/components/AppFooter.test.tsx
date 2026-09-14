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
    fetchVersionMock.mockResolvedValue("1.2.3");
  });

  it("renders the application name", async () => {
    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
  });

  it("renders the version the backend reported (version present)", async () => {
    fetchVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "v1.2.3",
    );
    expect(screen.getByTestId("app-footer")).toHaveTextContent(
      "Task Notes v1.2.3",
    );
    // Whatever the client returns is what is rendered: no literal in this
    // component can satisfy both this and the assertion below.
    expect(fetchVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders whatever version string the client resolves, including the backend's 'unknown'", async () => {
    fetchVersionMock.mockResolvedValue("unknown");

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-version")).toHaveTextContent(
      "vunknown",
    );
  });

  it("renders the unavailable marker and no version at all (version absent)", async () => {
    fetchVersionMock.mockRejectedValue(
      new Error("Loading the version failed: 500 Internal Server Error"),
    );

    render(<AppFooter />);

    expect(
      await screen.findByTestId("app-footer-version-unavailable"),
    ).toHaveTextContent("version unavailable");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();

    const footerText = screen.getByTestId("app-footer").textContent ?? "";
    expect(footerText).toBe("Task Notes · version unavailable");
    expect(footerText).not.toContain("undefined");
    expect(footerText).not.toContain("null");
  });

  it("renders exactly the app name while the version request is still pending", async () => {
    // Never settles, so the component stays in its loading state.
    fetchVersionMock.mockReturnValue(new Promise<string>(() => {}));

    render(<AppFooter />);

    await waitFor(() => expect(fetchVersionMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("app-footer-version-unavailable"),
    ).not.toBeInTheDocument();
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
