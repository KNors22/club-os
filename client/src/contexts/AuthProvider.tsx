import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, errorMessage } from "../lib/api";
import { AuthContext } from "./auth-context";
import type { User } from "../types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: User | null;
    loading: boolean;
    error: string;
  }>({ user: null, loading: true, error: "" });
  const sessionSuccess = useCallback(({ user }: { user: User }) => {
    setState({ user, loading: false, error: "" });
  }, []);
  const sessionFailure = useCallback((error: unknown) => {
    setState({
      user: null,
      loading: false,
      error:
        error instanceof ApiError && error.status === 401
          ? ""
          : errorMessage(error),
    });
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User }>("/auth/me", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) sessionSuccess(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) sessionFailure(error);
      });
    const expire = () => setState({ user: null, loading: false, error: "" });
    window.addEventListener("clubos:session-expired", expire);
    return () => {
      controller.abort();
      window.removeEventListener("clubos:session-expired", expire);
    };
  }, [sessionSuccess, sessionFailure]);
  const login = async (email: string, password: string) => {
    const { user } = await api<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setState({ user, loading: false, error: "" });
  };
  const register = async (name: string, email: string, password: string) => {
    const { user } = await api<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setState({ user, loading: false, error: "" });
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST", body: "{}" });
    setState({ user: null, loading: false, error: "" });
  };
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        retry: () => {
          setState((previous) => ({ ...previous, loading: true, error: "" }));
          void api<{ user: User }>("/auth/me")
            .then(sessionSuccess)
            .catch(sessionFailure);
        },
        updateUser: (user) => setState({ user, loading: false, error: "" }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
