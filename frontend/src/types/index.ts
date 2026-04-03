export interface ApiResponse<T> {
  status: "success" | "error"
  message: string
  data: T
}

export interface User {
  id: number
  name: string
  email: string
  role: "teacher" | "student"
}

export interface Class {
  id: number
  class_name: string
  teacher_id: number
}

export interface Student {
  id: number
  user_id: number
  class_id: number
  roll_number: string
  name: string
}

export interface StudentProfile {
  id: number
  student_id: number
  phone: string | null
  address: string | null
  dob: string | null
  profile_photo: string | null
  updated_at: string
}

export interface AttendanceSummary {
  total_classes: number
  present: number
  absent: number
  percentage: number
}

export interface AttendanceRecord {
  session_id: number
  date: string
  class_name: string
  status: "present" | "absent"
}

export interface SessionDetail {
  record_id: number
  student_id: number
  roll_number: string
  name: string
  status: "present" | "absent"
  profile_photo: string | null
}

export interface SessionDetails {
  session_id: number
  date: string
  class_id: number
  present_count: number
  absent_count: number
  total: number
  present: SessionDetail[]
  absent: SessionDetail[]
}

export interface ReportSession {
  session_id: number
  date: string
  total: number
  present_count: number
  absent_count: number
  records: {
    roll_number: string
    name: string
    status: "present" | "absent"
  }[]
}

export interface AttendanceResult {
  session_id: number
  present_count: number
  absent_count: number
  total_students: number
  faces_detected: number
  records: {
    roll_number: string
    name: string
    status: "present" | "absent"
  }[]
}