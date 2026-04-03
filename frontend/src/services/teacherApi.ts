import api from "./api"
import type {
  ApiResponse, ReportSession,
  SessionDetails, AttendanceResult
} from "../types"

export const teacherApi = {

  takeAttendance: async (class_id: number, image: File) => {
    const form = new FormData()
    form.append("class_id", String(class_id))
    form.append("image", image)
    const res = await api.post<ApiResponse<AttendanceResult>>(
      "/api/teacher/take-attendance", form
    )
    return res.data
  },

  getReport: async (class_id: number) => {
    const res = await api.get<ApiResponse<ReportSession[]>>(
      `/api/teacher/attendance-report?class_id=${class_id}`
    )
    return res.data
  },

  getSessionDetails: async (sessionId: number) => {
    const res = await api.get<ApiResponse<SessionDetails>>(
      `/api/teacher/session/${sessionId}/details`
    )
    return res.data
  },

  updateStatus: async (
    sessionId: number,
    updates: { student_id: number; status: "present" | "absent" }[]
  ) => {
    const res = await api.patch<ApiResponse<any>>(
      `/api/teacher/session/${sessionId}/update-status`,
      { updates }
    )
    return res.data
  },
}