import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendBuildInfo } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendBuildInfo: vi.fn(),
}));

const fetchBuildInfoMock = vi.mocked(fetchBackendBuildInfo);

function expectFooterText(text: string) {
  const footer = screen.getByTestId("app-footer");
  expect(footer.textContent).toBe(`${text}Build note`);
  for (const forbidden of ["undefined", "null", "unknown", "Error"]) {
    expect(footer.textContent).not.toContain(forbidden);
  }
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBuildInfoMock.mockReset();
  });

  it("renders the version and the first 7 characters of the commit", async () => {
    fetchBuildInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "a1b2c3d4e5f6",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      "(a1b2c3d)",
    );
    expect(screen.getByTestId("app-footer-version")).toHaveTextContent(
      "v0.1.0",
    );
    expectFooterText("Task Notes v0.1.0 (a1b2c3d)");
  });

  it("renders the application name alone while the request is pending", () => {
    fetchBuildInfoMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectFooterText("Task Notes");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the application name alone when the request fails", async () => {
    fetchBuildInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBuildInfoMock).toHaveBeenCalledTimes(1));
    expectFooterText("Task Notes");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the version alone when the commit is unresolved", async () => {
    fetchBuildInfoMock.mockResolvedValue({ version: "0.1.0", commit: null });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expectFooterText("Task Notes v0.1.0");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the application name alone when only the commit resolved", async () => {
    fetchBuildInfoMock.mockResolvedValue({
      version: null,
      commit: "a1b2c3d4e5f6",
    });

    render(<AppFooter />);

    await waitFor(() => expect(fetchBuildInfoMock).toHaveBeenCalledTimes(1));
    expectFooterText("Task Notes");
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the build note on its own line in the footer", async () => {
    fetchBuildInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "a1b2c3d4e5f6",
    });

    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    const note = screen.getByTestId("app-footer-build-note");
    expect(note).toHaveTextContent("Build note");
    expect(screen.getByTestId("app-footer")).toContainElement(note);
    expect(screen.getByRole("contentinfo")).toContainElement(note);
  });

  it("renders the build note when the version request fails", async () => {
    fetchBuildInfoMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBuildInfoMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task NotesBuild note",
    );
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", async () => {
    fetchBuildInfoMock.mockResolvedValue({
      version: "0.1.0",
      commit: "a1b2c3d4e5f6",
    });

    render(<AppFooter />);
    await screen.findByTestId("app-footer-version");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
