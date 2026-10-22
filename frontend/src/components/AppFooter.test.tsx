import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the application name, the version and the 7-character commit the client returned", async () => {
    // 9.9.9 and abcdef123456 are carried by no package or build, so they prove
    // the footer shows what the client resolved rather than a built-in value.
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    await screen.findByTestId("app-commit");
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes v9.9.9 (abcdef1)");
    expect(screen.getByTestId("app-version")).toHaveTextContent("v9.9.9");
    expect(screen.getByTestId("app-commit").textContent).toBe(" (abcdef1)");
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|Error/);
  });

  it("renders a commit shorter than 7 characters whole", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abc",
    });

    render(<AppFooter />);

    await screen.findByTestId("app-commit");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v9.9.9 (abc)",
    );
  });

  it("renders the version alone when the client resolves no commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: null,
    });

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes v9.9.9");
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|Error/);
  });

  it("fetches the version exactly once", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "9.9.9",
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    await screen.findByTestId("app-version");
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("renders exactly the app name when the version request rejects", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("backend down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|Error/);
  });

  it("renders exactly the app name when the client resolves no version", async () => {
    // A commit without a version is never shown: the commit sits next to the
    // version, so it needs one.
    fetchBackendVersionMock.mockResolvedValue({
      version: null,
      commit: "abcdef123456",
    });

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|Error/);
  });

  it("renders exactly the app name while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByTestId("app-footer");
    expect(footer.textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-commit")).not.toBeInTheDocument();
    expect(footer.textContent).not.toMatch(/undefined|null|unknown|Error/);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
