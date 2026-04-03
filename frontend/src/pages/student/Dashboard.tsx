import { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"
import StatusBadge from "../../components/StatusBadge"
import LoadingSpinner from "../../components/LoadingSpinner"
import Toast from "../../components/Toast"
import { studentApi } from "../../services/studentApi"
import type {
  Student, StudentProfile, AttendanceRecord,
  AttendanceSummary
} from "../../types"

const BASE = "http://127.0.0.1:5000"
type Tab = "profile" | "face" | "attendance"

export default function StudentDashboard() {
  const [tab, setTab] = useState<Tab>("profile")

  // Profile
  const [student, setStudent] = useState<Student | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [faceEnrolled, setFaceEnrolled] = useState(false)
  const [enrolledAt, setEnrolledAt] = useState<string | null>(null)

  // Edit form
  const [editPhone, setEditPhone] = useState("")
  const [editDob, setEditDob] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Face enrollment
  const [photo1, setPhoto1] = useState<File | null>(null)
  const [photo2, setPhoto2] = useState<File | null>(null)
  const [photo3, setPhoto3] = useState<File | null>(null)
  const [prev1, setPrev1] = useState<string | null>(null)
  const [prev2, setPrev2] = useState<string | null>(null)
  const [prev3, setPrev3] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  // Attendance
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  const [toast, setToast] = useState<{
    message: string; type: "success" | "error"
  } | null>(null)

  useEffect(() => {
    loadInfo()
    loadAttendance()
  }, [])

  const loadInfo = async () => {
    const res = await studentApi.getMyInfo()
    if (res.status !== "success") return
    const d = res.data
    setStudent(d.student)
    setProfile(d.profile)
    setFaceEnrolled(d.face_enrolled)
    setEnrolledAt(d.enrolled_at)
    if (d.profile) {
      setEditPhone(d.profile.phone || "")
      setEditDob(d.profile.dob || "")
      setEditAddress(d.profile.address || "")
    }
  }

  const loadAttendance = async () => {
    const res = await studentApi.getMyAttendance()
    if (res.status === "success") {
      setSummary(res.data.summary)
      setRecords(res.data.records)
    }
  }

  const handlePhotoSelect = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    if (!file) return
    setFile(file)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await studentApi.updateProfile({
        phone: editPhone || undefined,
        address: editAddress || undefined,
        dob: editDob || undefined,
        profile_photo: editPhoto || undefined,
      })
      if (res.status === "success") {
        setToast({ message: "Profile updated!", type: "success" })
        loadInfo()
      } else {
        setToast({ message: res.message, type: "error" })
      }
    } finally {
      setSaving(false)
    }
  }

  const enrollFace = async () => {
    if (!photo1 || !photo2 || !photo3) {
      return setToast({ message: "Upload all 3 photos", type: "error" })
    }
    setEnrolling(true)
    try {
      const res = await studentApi.enrollFace(photo1, photo2, photo3)
      if (res.status === "success") {
        setToast({ message: "Face enrolled successfully!", type: "success" })
        loadInfo()
      } else {
        setToast({ message: res.message, type: "error" })
      }
    } finally {
      setEnrolling(false)
    }
  }

  const photoUploadBox = (
    preview: string | null,
    label: string,
    onChange: (f: File | null) => void
  ) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">
        {label}
      </label>
      <label className="border-2 border-dashed border-gray-300 rounded-xl
                        p-4 text-center cursor-pointer hover:border-blue-400
                        block">
        {preview ? (
          <img src={preview} alt=""
            className="w-20 h-20 object-cover rounded-lg mx-auto mb-2" />
        ) : (
          <p className="text-xs text-gray-400 py-4">Click to upload</p>
        )}
        <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
          onChange={e =>
            onChange(e.target.files?.[0] || null)
          } />
      </label>
    </div>
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      {toast && (
        <Toast message={toast.message} type={toast.type}
          onClose={() => setToast(null)} />
      )}

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Student Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your profile and attendance
          </p>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 mb-8 flex gap-8">
          {([
            ["profile", "👤 My Profile"],
            ["face", "📸 Face Enrollment"],
            ["attendance", "📋 My Attendance"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2
                ${tab === t ? "tab-active" : "tab-inactive"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: PROFILE ── */}
        {tab === "profile" && (
          <div className="grid grid-cols-2 gap-8">

            {/* View */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-5">
                Current Profile
              </h3>

              {/* Photo + Name */}
              <div className="flex items-center gap-4 mb-6 pb-6
                              border-b border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full
                                overflow-hidden border-2 border-gray-200
                                flex items-center justify-center">
                  {profile?.profile_photo ? (
                    <img
                      src={`${BASE}/${profile.profile_photo}`}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-3xl">👤</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {student?.name || "—"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {student?.roll_number || "—"}
                  </p>
                </div>
              </div>

              {/* Info Rows */}
              {[
                { label: "Class ID", value: student?.class_id },
                { label: "Phone", value: profile?.phone },
                { label: "Date of Birth", value: profile?.dob },
                { label: "Address", value: profile?.address },
                {
                  label: "Face",
                  value: faceEnrolled ? "✅ Enrolled" : "❌ Not Enrolled"
                },
              ].map((row, i) => (
                <div key={i}
                  className="flex justify-between items-center py-3
                             border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className={`text-sm font-medium
                    ${row.label === "Face"
                      ? faceEnrolled ? "text-green-600" : "text-red-500"
                      : "text-gray-800"}`}>
                    {row.value || "Not set"}
                  </span>
                </div>
              ))}
            </div>

            {/* Edit */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-5">Edit Profile</h3>
              <div className="space-y-4">

                {/* Photo Upload */}
                <div>
                  <label className="text-xs font-semibold text-gray-600
                                    mb-2 block">
                    Profile Photo
                  </label>
                  <label className="border-2 border-dashed border-gray-300
                                    rounded-xl p-4 text-center cursor-pointer
                                    hover:border-blue-400 block">
                    {editPhotoPreview ? (
                      <img src={editPhotoPreview} alt=""
                        className="w-16 h-16 object-cover rounded-full
                                   mx-auto mb-2" />
                    ) : (
                      <p className="text-xs text-gray-400 py-2">
                        Click to upload photo
                      </p>
                    )}
                    <input type="file" accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0] || null
                        setEditPhoto(f)
                        if (f) {
                          const r = new FileReader()
                          r.onload = ev =>
                            setEditPhotoPreview(ev.target?.result as string)
                          r.readAsDataURL(f)
                        }
                      }} />
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600
                                    mb-1 block">Phone Number</label>
                  <input value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="e.g. 9876543210" className="input" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600
                                    mb-1 block">Date of Birth</label>
                  <input type="date" value={editDob}
                    onChange={e => setEditDob(e.target.value)}
                    className="input" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600
                                    mb-1 block">Address</label>
                  <textarea value={editAddress} rows={2}
                    onChange={e => setEditAddress(e.target.value)}
                    placeholder="e.g. 123 Main Street, Mumbai"
                    className="input resize-none" />
                </div>

                <button onClick={saveProfile} disabled={saving}
                  className="btn-primary w-full">
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: FACE ── */}
        {tab === "face" && (
          <div className="grid grid-cols-2 gap-8">

            {/* Status */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">
                  Enrollment Status
                </h3>
                {faceEnrolled ? (
                  <div className="flex items-center gap-3 bg-green-50
                                  border border-green-200 rounded-xl p-4">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-green-800">
                        Face Enrolled
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Enrolled on{" "}
                        {enrolledAt?.split(" ")[0] || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-yellow-50
                                  border border-yellow-200 rounded-xl p-4">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-yellow-800">
                        Not Enrolled
                      </p>
                      <p className="text-xs text-yellow-600 mt-0.5">
                        Upload 3 photos to enroll
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {faceEnrolled && (
                <div className="bg-blue-50 border border-blue-200
                                rounded-xl p-5 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="font-semibold text-blue-900">
                    You're all set!
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Attend class and get marked automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Upload Form */}
            {!faceEnrolled && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-2">
                  Enroll Your Face
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  Upload 3 clear solo photos. One face per photo only.
                </p>

                <div className="space-y-4 mb-6">
                  {photoUploadBox(prev1, "Photo 1 — Front facing", f => {
                    handlePhotoSelect(f, setPhoto1, setPrev1)
                  })}
                  {photoUploadBox(prev2, "Photo 2 — Slight left", f => {
                    handlePhotoSelect(f, setPhoto2, setPrev2)
                  })}
                  {photoUploadBox(prev3, "Photo 3 — Slight right", f => {
                    handlePhotoSelect(f, setPhoto3, setPrev3)
                  })}
                </div>

                {enrolling && (
                  <div className="text-center py-4 mb-4">
                    <LoadingSpinner />
                    <p className="text-xs text-gray-500 mt-2">
                      Extracting face embeddings...
                    </p>
                  </div>
                )}

                <button onClick={enrollFace} disabled={enrolling}
                  className="btn-primary w-full">
                  {enrolling ? "Processing..." : "Enroll My Face"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ATTENDANCE ── */}
        {tab === "attendance" && (
          <div className="card">

            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-4 gap-4 mb-8 pb-8
                              border-b border-gray-100">
                {[
                  { v: summary.total_classes, l: "Total Classes", c: "text-gray-800" },
                  { v: summary.present, l: "Present", c: "text-green-600" },
                  { v: summary.absent, l: "Absent", c: "text-red-500" },
                  { v: `${summary.percentage}%`, l: "Attendance %", c: "text-blue-700" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className={`text-3xl font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Records Table */}
            {records.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-sm">No attendance records yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {["Session", "Date", "Class", "Status"].map(h => (
                      <th key={h} className="text-left py-3 px-6 text-xs
                        font-semibold text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}
                      className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-6 text-sm text-gray-500">
                        #{r.session_id}
                      </td>
                      <td className="py-3 px-6 text-sm font-medium
                                     text-gray-700">
                        {r.date}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-600">
                        {r.class_name}
                      </td>
                      <td className="py-3 px-6">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </main>
    </div>
  )
}