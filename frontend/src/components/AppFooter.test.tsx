import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AppFooter from "./AppFooter";
import { fetchBackendVersion } from "../api/version";

vi.mock("../api/version", () => ({
  fetchBackendVersion: vi.fn(),
}));

const fetchBackendVersionMock = vi.mocked(fetchBackendVersion);

function expectNoVersionArtifacts(text: string | null) {
  expect(text).toBe("Task Notes");
  for (const artifact of ["undefined", "null", "unknown", " v"]) {
    expect(text).not.toContain(artifact);
  }
}

describe("AppFooter", () => {
  beforeEach(() => {
    fetchBackendVersionMock.mockReset();
  });

  it("renders the app name and the backend version when it resolves", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer").textContent).toBe(
        "Task Notes v9.9.9",
      ),
    );
  });

  it("renders the app name alone when the version cannot be loaded", async () => {
    fetchBackendVersionMock.mockRejectedValue(new Error("network down"));

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expectNoVersionArtifacts(screen.getByTestId("app-footer").textContent);
  });

  it("renders the app name alone when the backend version is unknown", async () => {
    fetchBackendVersionMock.mockResolvedValue(null);

    render(<AppFooter />);

    await waitFor(() => expect(fetchBackendVersionMock).toHaveBeenCalled());
    expectNoVersionArtifacts(screen.getByTestId("app-footer").textContent);
  });

  it("renders the app name alone while the version is still loading", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    expectNoVersionArtifacts(screen.getByTestId("app-footer").textContent);
  });

  it("requests the version once on mount", async () => {
    fetchBackendVersionMock.mockResolvedValue("9.9.9");

    render(<AppFooter />);

    await waitFor(() =>
      expect(screen.getByTestId("app-footer")).toHaveTextContent("v9.9.9"),
    );
    expect(fetchBackendVersionMock).toHaveBeenCalledTimes(1);
  });

  it("is exposed as the contentinfo landmark and carries the app-footer test id", () => {
    fetchBackendVersionMock.mockReturnValue(new Promise(() => {}));

    render(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-testid", "app-footer");
  });
});
