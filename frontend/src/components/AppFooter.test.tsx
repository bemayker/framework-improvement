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
  expect(text).not.toMatch(/undefined|null|unknown/i);
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the name and the backend version when it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("1.2.3");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent(
        "Task Notes v1.2.3",
      ),
    );
    expect(screen.getByTestId("app-footer-version")).toHaveTextContent("v1.2.3");
  });

  it("renders the name alone while the version is pending", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes");
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
  });

  it("renders the name alone when the version request fails", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes"),
    );
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expectNoPlaceholderText();
  });

  it("renders the name alone when the backend has no usable version", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe("Task Notes"),
    );
    expect(screen.queryByTestId("app-footer-version")).not.toBeInTheDocument();
    expectNoPlaceholderText();
  });

  it("requests the version once on mount", async () => {
    fetchBackendVersionMock.mockResolvedValue("1.2.3");

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
