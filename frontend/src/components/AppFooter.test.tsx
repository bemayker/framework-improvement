import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

function expectNoPlaceholderText() {
  const text = screen.getByTestId("app-footer").textContent ?? "";
  expect(text).not.toMatch(/undefined|null|unknown|\(\)/i);
}

async function expectNameAlone() {
  await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes"),
  );
  expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  expectNoPlaceholderText();
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the name, the backend version and the first 7 commit characters when it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "1.2.3",
      commit: "3761feee7215",
    });

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v1.2.3 (3761fee)",
      ),
    );
    expect(screen.getByTestId("app-footer-version")).toHaveTextContent("v1.2.3");
    expect(screen.getByTestId("app-footer-commit")).toHaveTextContent(
      "(3761fee)",
    );
  });

  it("shows a commit shorter than 7 characters whole", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "1.2.3",
      commit: "abc12",
    });

    render(<AppFooter />);

    expect(await screen.findByTestId("app-footer-commit")).toHaveTextContent(
      "(abc12)",
    );
  });

  it("renders the name alone while the request is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
  });

  it("renders the name alone when the request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await expectNameAlone();
  });

  it("renders the name alone when the backend has no usable version or commit", async () => {
    fetchBackendVersionMock.mockResolvedValue({ version: null, commit: null });

    render(<AppFooter />);

    await expectNameAlone();
  });

  it("renders the version alone when the commit is unknown", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "1.2.3",
      commit: null,
    });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(screen.getByTestId("app-footer").textContent).toBe(
      "Task Notes v1.2.3",
    );
    expect(screen.queryByTestId("app-footer-commit")).not.toBeInTheDocument();
    expectNoPlaceholderText();
  });

  it("renders the name alone when the version is null even if a commit is present", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: null,
      commit: "3761feee7215",
    });

    render(<AppFooter />);

    await expectNameAlone();
  });

  it("requests the version once on mount", async () => {
    fetchBackendVersionMock.mockResolvedValue({
      version: "1.2.3",
      commit: "3761feee7215",
    });

    render(<AppFooter />);

    await screen.findByTestId("app-footer-version");
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
