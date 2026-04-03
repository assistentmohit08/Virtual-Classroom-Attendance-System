import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar"
import StatusBadge from "../../components/StatusBadge"
import LoadingSpinner from "../../components/LoadingSpinner"
import Toast from "../../components/Toast"
import { classApi } from "../../services/classApi"
import { teacherApi } from "../../services/teacherApi"
import type { Class, ReportSession, SessionDetails, SessionDetail } from "../../types"

const BASE = "http://127.0.0.1:5000"

interface ConfirmState {
  sessionId: number
  student: SessionDetail
  targetStatus: "present" | "absent"
}

export default function TeacherReport() {
  const [classes, setClasses] = useState<Class[]>([])
  const [classId, setClassId] = useState("")
  const [sessions, setSessions] = useState<ReportSession[]>([])
  const [details, setDetails] = useState<Record<number, SessionDetails>>({})
  const [activeFilter, setActiveFilter] = useState<Record<number, "present" | "absent">>({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [toast, setToast] = useState<{
    message: string; type: "success" | "error"
  } | null>(null)

  useEffect(() => {
    classApi.getMyClasses().then(res => {
      if (res.status === "success") setClasses(res.data)
    })
  }, [])

  const loadReport = async () => {
    if (!classId) return setToast({
      message: "Select a class first", type: "error"
    })
    setLoading(true)
    setSessions([])
    setDetails({})
    try {
      const res = await teacherApi.getReport(parseInt(classId))
      if (res.status === "success") {
        setSessions(res.data)
        const filters: Record<number, "present" | "absent"> = {}
        res.data.forEach(s => { filters[s.session_id] = "present" })
        setActiveFilter(filters)
        for (const s of res.data) {
          teacherApi.getSessionDetails(s.session_id).then(d => {
            if (d.status === "success") {
              setDetails(prev => ({
                ...prev,
                [s.session_id]: d.data
              }))
            }
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  /** Called when teacher confirms "Yes" in the popup */
  const confirmStatusChange = async () => {
    if (!confirm) return
    const { sessionId, student, targetStatus } = confirm
    setConfirm(null)
    setSavingId(student.student_id)

    try {
      const res = await teacherApi.updateStatus(sessionId, [
        { student_id: student.student_id, status: targetStatus }
      ])
      if (res.status === "success") {
        // Move student between lists in local state
        setDetails(prev => {
          const sess = prev[sessionId]
          if (!sess) return prev
          const updated: SessionDetail = { ...student, status: targetStatus }
          if (targetStatus === "present") {
            return {
              ...prev,
              [sessionId]: {
                ...sess,
                present: [...sess.present, updated],
                absent: sess.absent.filter(a => a.student_id !== student.student_id),
              }
            }
          } else {
            return {
              ...prev,
              [sessionId]: {
                ...sess,
                absent: [...sess.absent, updated],
                present: sess.present.filter(p => p.student_id !== student.student_id),
              }
            }
          }
        })
        // Update session counts
        setSessions(prev =>
          prev.map(s => {
            if (s.session_id !== sessionId) return s
            return targetStatus === "present"
              ? { ...s, present_count: s.present_count + 1, absent_count: s.absent_count - 1 }
              : { ...s, present_count: s.present_count - 1, absent_count: s.absent_count + 1 }
          })
        )
        setToast({
          message: `${student.name} marked as ${targetStatus === "present" ? "Present" : "Absent"}!`,
          type: "success"
        })
      } else {
        setToast({ message: res.message || "Failed to update", type: "error" })
      }
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      {toast && (
        <Toast message={toast.message} type={toast.type}
          onClose={() => setToast(null)} />
      )}

      {/* ── Confirmation Modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4
                          border border-gray-100 animate-fadeIn">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center
                              justify-center text-3xl
                              ${confirm.targetStatus === "present"
                  ? "bg-green-100" : "bg-red-100"}`}>
                {confirm.targetStatus === "present" ? "✅" : "❌"}
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
              Mark as {confirm.targetStatus === "present" ? "Present" : "Absent"}?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-1">
              You are about to manually mark
            </p>
            <p className="text-base font-semibold text-gray-800 text-center mb-1">
              {confirm.student.name}
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              ({confirm.student.roll_number}) as{" "}
              <span className={confirm.targetStatus === "present"
                ? "text-green-600 font-semibold"
                : "text-red-500 font-semibold"}>
                {confirm.targetStatus === "present" ? "Present" : "Absent"}
              </span>.
              <br />This action will be saved immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200
                           text-gray-600 font-semibold text-sm
                           hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`flex-1 py-2.5 rounded-xl text-white
                           font-semibold text-sm transition-all shadow-sm
                           ${confirm.targetStatus === "present"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-500 hover:bg-red-600"}`}>
                Yes, Mark {confirm.targetStatus === "present" ? "Present" : "Absent"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Reports
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View attendance records and manually mark absent students as present
            </p>
          </div>
          <Link to="/teacher/dashboard"
            className="px-4 py-2 border border-blue-700 text-blue-700
                       rounded-lg text-sm font-medium hover:bg-blue-50">
            ← Dashboard
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="card mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Class
              </label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="input">
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={loadReport}
              className="btn-primary px-8">
              Load Report
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Empty */}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-sm">Select a class and click Load Report</p>
          </div>
        )}

        {/* Sessions */}
        {sessions.map(session => {
          const det = details[session.session_id]
          const filter = activeFilter[session.session_id] || "present"
          const students = det
            ? (filter === "present" ? det.present : det.absent)
            : []

          return (
            <div key={session.session_id}
              className="bg-white rounded-2xl border border-gray-200
                         shadow-sm mb-8">

              {/* Header */}
              <div className="flex items-center justify-between p-6
                              border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">
                    Session #{session.session_id}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    📅 {session.date}
                  </p>
                </div>
                <div className="flex gap-6">
                  {[
                    { v: session.present_count, l: "Present", c: "text-green-600" },
                    { v: session.absent_count, l: "Absent", c: "text-red-500" },
                    { v: session.total, l: "Total", c: "text-gray-700" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
                      <p className="text-xs text-gray-400">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Present / Absent Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveFilter(p => ({
                    ...p, [session.session_id]: "present"
                  }))}
                  className={`flex-1 py-3 text-sm font-semibold
                    border-b-2 transition-all
                    ${filter === "present"
                      ? "text-green-700 bg-green-50 border-green-500"
                      : "text-gray-500 border-transparent hover:bg-gray-50"
                    }`}>
                  ✅ Present ({session.present_count})
                </button>
                <button
                  onClick={() => setActiveFilter(p => ({
                    ...p, [session.session_id]: "absent"
                  }))}
                  className={`flex-1 py-3 text-sm font-semibold
                    border-b-2 transition-all
                    ${filter === "absent"
                      ? "text-red-600 bg-red-50 border-red-500"
                      : "text-gray-500 border-transparent hover:bg-gray-50"
                    }`}>
                  ❌ Absent ({session.absent_count})
                </button>
              </div>

              {/* Student Cards */}
              <div className="p-6">
                {!det ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">
                      {filter === "present" ? "😔" : "🎉"}
                    </p>
                    <p className="text-sm">No {filter} students</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {students.map(s => {
                      const isSaving = savingId === s.student_id

                      return (
                        <div key={s.student_id}
                          className="bg-white rounded-xl p-4 text-center
                                     border border-gray-200 shadow-sm">

                          {/* Photo */}
                          <div className={`w-16 h-16 rounded-full mx-auto
                            mb-3 overflow-hidden bg-gray-100 flex items-center
                            justify-center border-2
                            ${s.status === "present"
                              ? "border-green-400"
                              : "border-red-300"}`}>
                            {s.profile_photo ? (
                              <img
                                src={`${BASE}/${s.profile_photo}`}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-2xl">👤</span>
                            )}
                          </div>

                          {/* Info */}
                          <p className="text-sm font-bold text-gray-800">
                            {s.name}
                          </p>
                          <p className="text-xs text-gray-400 mb-1">
                            {s.roll_number}
                          </p>
                          <p className="text-xs text-gray-300 mb-3">
                            ID: {s.student_id}
                          </p>

                          {/* Badge */}
                          <div className="mb-3">
                            <StatusBadge status={s.status} />
                          </div>

                          {/* Action button — Mark Present on Absent tab, Mark Absent on Present tab */}
                          {filter === "absent" ? (
                            <button
                              disabled={isSaving}
                              onClick={() => setConfirm({
                                sessionId: session.session_id,
                                student: s,
                                targetStatus: "present"
                              })}
                              className="w-full text-xs py-2 px-3 rounded-lg
                                font-medium border transition-all
                                bg-green-50 text-green-600 border-green-200
                                hover:bg-green-100 disabled:opacity-50
                                disabled:cursor-not-allowed">
                              {isSaving ? "Saving…" : "✅ Mark Present"}
                            </button>
                          ) : (
                            <button
                              disabled={isSaving}
                              onClick={() => setConfirm({
                                sessionId: session.session_id,
                                student: s,
                                targetStatus: "absent"
                              })}
                              className="w-full text-xs py-2 px-3 rounded-lg
                                font-medium border transition-all
                                bg-red-50 text-red-500 border-red-200
                                hover:bg-red-100 disabled:opacity-50
                                disabled:cursor-not-allowed">
                              {isSaving ? "Saving…" : "❌ Mark Absent"}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </main>
    </div>
  )
}