"use client";

import { create } from "zustand";
import {
  apiFetch,
  apiJson,
  clearSessionStorage,
  persistSession,
  readAccessToken,
  readUserJson,
} from "./client";
import type { AuthTokens, AuthUser } from "./types";

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,

  hydrate: () => {
    const user = readUserJson<AuthUser>();
    const token = readAccessToken();
    set({ user: token && user ? user : null, hydrated: true });
  },

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    const data = await apiJson<AuthTokens>(
      "/auth/login",
      { email, password },
      { auth: false, method: "POST" },
    );
    persistSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    set({ user: data.user });
  },

  register: async (email, password, fullName) => {
    await apiJson(
      "/auth/register",
      { email, password, fullName },
      { auth: false, method: "POST" },
    );
    await get().login(email, password);
  },

  logout: async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // clear local even if backend logout fails
    }
    clearSessionStorage();
    set({ user: null });
  },
}));
