import { useState, useEffect, useRef } from "react"
import Navbar from "../../components/Navbar"
import StatusBadge from "../../components/StatusBadge"
import LoadingSpinner from "../../components/LoadingSpinner"
import Toast from "../../components/Toast"
import { classApi } from "../../services/classApi"
import { teacherApi } from "../../services/teacherApi"
import type { Class, Student, AttendanceResult } from "../../types"

type Tab = "classes" | "attendance"
type PhotoSource = "gallery" | "camera"

export default function TeacherDashboard() {
  const [tab, setTab] = useState<Tab>("classes")
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [newClassName, setNewClassName] = useState("")
  const [enrollUserId, setEnrollUserId] = useState("")
  const [enrollRoll, setEnrollRoll] = useState("")

  // Attendance
  const [photoSource, setPhotoSource] = useState<PhotoSource>("gallery")
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [, setCameraActive] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [attendanceClassId, setAttendanceClassId] = useState("")
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<AttendanceResult | null>(null)

  const [toast, setToast] = useState<{
    message: string; type: "success" | "error"
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    loadClasses()
  }, [])

  // Stop camera when switching tabs
  useEffect(() => {
    if (tab !== "attendance") stopCamera()
  }, [tab])

  // ── CLASSES ──────────────────────────────
  const loadClasses = async () => {
    const res = await classApi.getMyClasses()
    if (res.status === "success") setClasses(res.data)
  }

  const createClass = async () => {
    if (!newClassName.trim()) return
    const res = await classApi.createClass(newClassName.trim())
    if (res.status === "success") {
      setToast({ message: `Class "${newClassName}" created!`, type: "success" })
      setNewClassName("")
      loadClasses()
    } else {
      setToast({ message: res.message, type: "error" })
    }
  }

  const selectClass = async (cls: Class) => {
    setSelectedClass(cls)
    const res = await classApi.getStudents(cls.id)
    if (res.status === "success") setStudents(res.data)
  }

  const enrollStudent = async () => {
    if (!enrollUserId || !enrollRoll) return
    if (!selectedClass) return setToast({
      message: "Select a class first", type: "error"
    })
    const res = await classApi.enrollStudent(
      parseInt(enrollUserId), selectedClass.id, enrollRoll
    )
    if (res.status === "success") {
      setToast({ message: "Student enrolled!", type: "success" })
      setEnrollUserId("")
      setEnrollRoll("")
      selectClass(selectedClass)
    } else {
      setToast({ message: res.message, type: "error" })
    }
  }

  // ── CAMERA ───────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
      setCaptured(false)
      setCapturedBlob(null)
    } catch {
      setToast({ message: "Camera access denied", type: "error" })
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      setCapturedBlob(blob)
      setCaptured(true)
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob)
      }
    }, "image/jpeg", 0.95)
  }

  const retakePhoto = () => {
    setCaptured(false)
    setCapturedBlob(null)
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
    setCaptured(false)
    setCapturedBlob(null)
  }

  const switchPhotoSource = (source: PhotoSource) => {
    setPhotoSource(source)
    if (source === "camera") startCamera()
    else stopCamera()
  }

  // ── TAKE ATTENDANCE ───────────────────────
  const takeAttendance = async () => {
    if (!attendanceClassId) return setToast({
      message: "Select a class", type: "error"
    })

    let imageFile: File | null = null
    if (photoSource === "gallery") {
      if (!galleryFile) return setToast({
        message: "Upload a classroom photo", type: "error"
      })
      imageFile = galleryFile
    } else {
      if (!capturedBlob) return setToast({
        message: "Capture a photo first", type: "error"
      })
      imageFile = new File([capturedBlob], "capture.jpg",
        { type: "image/jpeg" })
    }

    setProcessing(true)
    setResult(null)
    try {
      const res = await teacherApi.takeAttendance(
        parseInt(attendanceClassId), imageFile
      )
      if (res.status === "success") {
        setResult(res.data)
        stopCamera()
      } else {
        setToast({ message: res.message, type: "error" })
      }
    } catch {
      setToast({ message: "Server error. Try again.", type: "error" })
    } finally {
      setProcessing(false)
    }
  }

  // ── RENDER ────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      {toast && (
        <Toast message={toast.message} type={toast.type}
          onClose={() => setToast(null)} />
      )}

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Teacher Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage classes and take attendance
          </p>
        </div>

        {/* TABS */}
        <div className="border-b border-gray-200 mb-8 flex gap-8">
          {(["classes", "attendance"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize border-b-2
                ${tab === t ? "tab-active" : "tab-inactive"}`}>
              {t === "classes" ? "📚 My Classes" : "📸 Take Attendance"}
            </button>
          ))}
        </div>

        {/* ── TAB: CLASSES ── */}
        {tab === "classes" && (
          <div>
            <div className="grid grid-cols-3 gap-8">

              {/* Create */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">
                  Create New Class
                </h3>
                <input
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. Computer Science A"
                  className="input mb-3"
                />
                <button onClick={createClass} className="btn-primary w-full">
                  + Create Class
                </button>
              </div>

              {/* Class List */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Your Classes</h3>
                {classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-4xl mb-2">📚</p>
                    <p className="text-sm">No classes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classes.map(cls => (
                      <div key={cls.id}
                        onClick={() => selectClass(cls)}
                        className={`flex items-center justify-between p-4
                          rounded-xl border cursor-pointer transition-all
                          ${selectedClass?.id === cls.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-gray-50 hover:border-blue-300"
                          }`}>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {cls.class_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ID: {cls.id}
                          </p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700
                                         font-bold px-2 py-1 rounded-lg">
                          #{cls.id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enroll */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-1">
                  Enroll Student
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Select a class first, then enroll
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600
                                      mb-1 block">
                      Student User ID
                    </label>
                    <input
                      type="number"
                      value={enrollUserId}
                      onChange={e => setEnrollUserId(e.target.value)}
                      placeholder="e.g. 2"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600
                                      mb-1 block">
                      Roll Number
                    </label>
                    <input
                      value={enrollRoll}
                      onChange={e => setEnrollRoll(e.target.value)}
                      placeholder="e.g. CS001"
                      className="input"
                    />
                  </div>
                  <button onClick={enrollStudent}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl
                               text-sm font-semibold hover:bg-gray-800">
                    Enroll Student
                  </button>
                </div>
              </div>
            </div>

            {/* Students Table */}
            {selectedClass && (
              <div className="mt-8 bg-white rounded-2xl border
                              border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">
                    Students in:{" "}
                    <span className="text-blue-700">
                      {selectedClass.class_name}
                    </span>
                  </h3>
                </div>
                {students.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm">No students enrolled yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {["Roll No", "Name", "User ID"].map(h => (
                          <th key={h} className="text-left py-3 px-6
                            text-xs font-semibold text-gray-500 uppercase">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id}
                          className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-6 text-sm font-medium">
                            {s.roll_number}
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-600">
                            {s.name}
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-400">
                            {s.user_id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ATTENDANCE ── */}
        {tab === "attendance" && (
          <div className="grid grid-cols-2 gap-8">

            {/* Left — Upload/Camera */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-6">Take Attendance</h3>

              {/* Class Select */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700
                                  mb-2 block">
                  Select Class
                </label>
                <select
                  value={attendanceClassId}
                  onChange={e => setAttendanceClassId(e.target.value)}
                  className="input">
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Toggle */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700
                                  mb-2 block">
                  Photo Source
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["gallery", "camera"] as PhotoSource[]).map(s => (
                    <button key={s}
                      onClick={() => switchPhotoSource(s)}
                      className={`py-2 px-4 rounded-lg border-2 text-sm
                        font-medium transition-all
                        ${photoSource === s
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-blue-300"
                        }`}>
                      {s === "gallery" ? "🖼 From Gallery" : "📷 Use Camera"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gallery Mode */}
              {photoSource === "gallery" && (
                <div>
                  <label
                    className="border-2 border-dashed border-gray-300
                               rounded-xl p-8 text-center hover:border-blue-400
                               cursor-pointer block">
                    <p className="text-4xl mb-2">📸</p>
                    <p className="text-sm text-gray-500">
                      {galleryFile
                        ? `✅ ${galleryFile.name}`
                        : "Click to upload classroom photo"}
                    </p>
                    <input type="file" accept=".jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => setGalleryFile(
                        e.target.files?.[0] || null
                      )} />
                  </label>
                </div>
              )}

              {/* Camera Mode */}
              {photoSource === "camera" && (
                <div>
                  <div className="relative rounded-xl overflow-hidden
                                  bg-black mb-3"
                    style={{ aspectRatio: "4/3" }}>
                    <video ref={videoRef} autoPlay playsInline
                      className={`w-full h-full object-cover
                        ${captured ? "hidden" : ""}`} />
                    <img ref={previewRef} alt="captured"
                      className={`absolute inset-0 w-full h-full
                        object-cover ${!captured ? "hidden" : ""}`} />
                    {captured && (
                      <button onClick={retakePhoto}
                        className="absolute top-3 right-3 bg-black
                                   bg-opacity-60 text-white text-xs
                                   px-3 py-1 rounded-lg">
                        🔄 Retake
                      </button>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  {!captured ? (
                    <button onClick={capturePhoto}
                      className="btn-primary w-full">
                      📷 Capture Photo
                    </button>
                  ) : (
                    <p className="text-center text-xs text-green-600
                                  font-medium py-2">
                      ✅ Photo captured — ready to take attendance
                    </p>
                  )}
                </div>
              )}

              {/* Processing */}
              {processing && (
                <div className="text-center py-6 mt-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-sm text-gray-500 mt-3">
                    AI is detecting faces...
                  </p>
                </div>
              )}

              <button
                onClick={takeAttendance}
                disabled={processing}
                className="btn-primary w-full mt-5">
                {processing ? "Processing..." : "🚀 Take Attendance"}
              </button>
            </div>

            {/* Right — Result */}
            {result && (
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-6">
                  ✅ Attendance Result
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Present", value: result.present_count, color: "bg-green-50 text-green-700" },
                    { label: "Absent", value: result.absent_count, color: "bg-red-50 text-red-600" },
                    { label: "Total", value: result.total_students, color: "bg-blue-50 text-blue-700" },
                    { label: "Faces Detected", value: result.faces_detected, color: "bg-gray-50 text-gray-700" },
                  ].map((s, i) => (
                    <div key={i}
                      className={`${s.color} rounded-xl p-4 text-center`}>
                      <p className="text-3xl font-bold">{s.value}</p>
                      <p className="text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {["Roll", "Name", "Status"].map(h => (
                        <th key={h} className="text-left py-2 px-3
                          text-xs font-semibold text-gray-500 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((r, i) => (
                      <tr key={i}
                        className="border-b border-gray-100">
                        <td className="py-3 px-3 text-sm font-medium">
                          {r.roll_number}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">
                          {r.name}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <a href="/teacher/report"
                  className="block text-center mt-4 text-sm text-blue-700
                             font-medium hover:underline">
                  View Full Report →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}