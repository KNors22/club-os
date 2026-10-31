import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "../contexts/auth-context";
import { AuthPage } from "../pages/AuthPage";
function auth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    user: null,
    loading: false,
    error: "",
    retry: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    ...overrides,
  };
}
describe("account forms", () => {
  it("submits accessible registration fields and navigates to the workspace", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AuthContext.Provider value={auth({ register })}>
          <Routes>
            <Route path="/register" element={<AuthPage register />} />
            <Route path="/clubs" element={<h1>Your workspace</h1>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full name"), "Jordan Lee");
    await user.type(
      screen.getByLabelText("Email address"),
      "jordan@example.com",
    );
    await user.type(
      screen.getByLabelText("Password"),
      "a-long-enough-password",
    );
    await user.click(
      screen.getByRole("button", { name: /create your account/i }),
    );
    expect(register).toHaveBeenCalledWith(
      "Jordan Lee",
      "jordan@example.com",
      "a-long-enough-password",
    );
    expect(
      await screen.findByRole("heading", { name: "Your workspace" }),
    ).toBeInTheDocument();
  });
  it("shows a login error and allows another attempt without clearing input", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ notifications: { mode: "disabled" } })),
        ),
    );
    const login = vi
      .fn()
      .mockRejectedValue(new Error("Email or password is incorrect."));
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth({ login })}>
          <AuthPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Email address"),
      "jordan@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "incorrect");
    await user.click(
      screen.getByRole("button", { name: /sign in to clubos/i }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
    );
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "jordan@example.com",
    );
    expect(
      screen.getByRole("button", { name: /sign in to clubos/i }),
    ).toBeEnabled();
  });
});

describe("public demo sign-in", () => {
  it("fills public credentials and uses the normal login flow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            publicDemo: {
              password: "ClubOSDemo2026!",
              accounts: [
                { email: "admin@clubos.example", role: "Administrator" },
                { email: "member@clubos.example", role: "Member" },
              ],
            },
          }),
        ),
      ),
    );
    const login = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth({ login })}>
          <AuthPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Try administrator" }),
    );
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "admin@clubos.example",
    );
    expect(screen.getByLabelText("Password")).toHaveValue("ClubOSDemo2026!");
    await userEvent.click(
      screen.getByRole("button", { name: /sign in to clubos/i }),
    );
    expect(login).toHaveBeenCalledWith(
      "admin@clubos.example",
      "ClubOSDemo2026!",
    );
  });
  it("keeps public credentials hidden when the service disables demo mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ notifications: { mode: "disabled" } })),
        ),
    );
    render(
      <MemoryRouter>
        <AuthContext.Provider value={auth()}>
          <AuthPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("region", { name: "Public demo accounts" }),
    ).not.toBeInTheDocument();
  });
});
