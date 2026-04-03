import api from "./api"
import type {
  ApiResponse, AttendanceSummary, AttendanceRecord,
  StudentProfile, Student
} from "../types"

interface MyInfoData {
  student: Student
  face_enrolled: boolean
  enrolled_at: string | null
  profile: StudentProfile | null
}

interface MyAttendanceData {
  summary: AttendanceSummary
  records: AttendanceRecord[]
}

export const studentApi = {

  getMyInfo: async () => {
    const res = await api.get<ApiResponse<MyInfoData>>(
      "/api/student/my-info"
    )
    return res.data
  },

  enrollFace: async (
    photo1: File,
    photo2: File,
    photo3: File
  ) => {
    const form = new FormData()
    form.append("photo1", photo1)
    form.append("photo2", photo2)
    form.append("photo3", photo3)
    const res = await api.post<ApiResponse<any>>(
      "/api/student/enroll-face", form
    )
    return res.data
  },

  updateProfile: async (data: {
    phone?: string
    address?: string
    dob?: string
    profile_photo?: File
  }) => {
    const form = new FormData()
    if (data.phone) form.append("phone", data.phone)
    if (data.address) form.append("address", data.address)
    if (data.dob) form.append("dob", data.dob)
    if (data.profile_photo) form.append("profile_photo", data.profile_photo)
    const res = await api.put<ApiResponse<StudentProfile>>(
      "/api/student/update-profile", form
    )
    return res.data
  },

  getMyAttendance: async () => {
    const res = await api.get<ApiResponse<MyAttendanceData>>(
      "/api/student/my-attendance"
    )
    return res.data
  },
}