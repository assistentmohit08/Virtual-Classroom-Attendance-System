import api from "./api"
import type { ApiResponse, Class, Student } from "../types"

export const classApi = {

  createClass: async (class_name: string) => {
    const res = await api.post<ApiResponse<Class>>("/api/classes/create", {
      class_name
    })
    return res.data
  },

  getMyClasses: async () => {
    const res = await api.get<ApiResponse<Class[]>>("/api/classes/my-classes")
    return res.data
  },

  enrollStudent: async (
    user_id: number,
    class_id: number,
    roll_number: string
  ) => {
    const res = await api.post<ApiResponse<Student>>("/api/classes/enroll", {
      user_id, class_id, roll_number
    })
    return res.data
  },

  getStudents: async (classId: number) => {
    const res = await api.get<ApiResponse<Student[]>>(
      `/api/classes/${classId}/students`
    )
    return res.data
  },
}