import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

// Dummy component to test context
const ThemeToggleTest = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        data-testid="toggle-btn"
      >
        Toggle
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    // mock localStorage
    const localStorageMock = (function () {
      let store: Record<string, string> = {};
      return {
        getItem: function (key: string) {
          return store[key] || null;
        },
        setItem: function (key: string, value: string) {
          store[key] = value.toString();
        },
        clear: function () {
          store = {};
        },
      };
    })();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    window.localStorage.clear();
    // mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('deve inicializar com o tema "dark" por padrão', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggleTest />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("deve alternar o tema ao clicar", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggleTest />
      </ThemeProvider>,
    );

    const toggleBtn = screen.getByTestId("toggle-btn");

    // Toggle para light
    await act(async () => {
      await user.click(toggleBtn);
    });

    expect(screen.getByTestId("current-theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("naveo-ui-theme")).toBe("light");

    // Toggle de volta para dark
    await act(async () => {
      await user.click(toggleBtn);
    });

    expect(screen.getByTestId("current-theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
