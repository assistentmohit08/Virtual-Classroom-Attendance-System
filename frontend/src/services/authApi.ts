import api from "./api"
import type { ApiResponse, User } from "../types"

export const authApi = {

  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<User>>("/api/auth/login", {
      email, password
    })
    return res.data
  },

  register: async (
    name: string,
    email: string,
    password: string,
    role: "teacher" | "student"
  ) => {
    const res = await api.post<ApiResponse<User>>("/api/auth/register", {
      name, email, password, role
    })
    return res.data
  },

  logout: async () => {
    const res = await api.post<ApiResponse<null>>("/api/auth/logout")
    return res.data
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>("/api/auth/me")
    return res.data
  },
}