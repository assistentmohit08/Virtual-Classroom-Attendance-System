import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { authApi } from "../services/authApi"
import Toast from "../components/Toast"

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"teacher" | "student">("student")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    message: string; type: "success" | "error"
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.register(name, email, password, role)
      if (res.status === "success") {
        setToast({ message: "Account created! Please login.", type: "success" })
        setTimeout(() => navigate("/login"), 1500)
      } else {
        setToast({ message: res.message, type: "error" })
      }
    } catch {
      setToast({ message: "Registration failed. Try again.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
                    justify-center px-4 py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-white font-bold">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">
            Join AttendAI today
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role Toggle */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["student", "teacher"] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 rounded-xl text-sm font-semibold border-2
                      capitalize transition-all
                      ${role === r
                        ? "border-blue-700 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>
                    {r === "student" ? "👨‍🎓" : "👨‍🏫"} {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full">
              {loading ? "Creating account..." : "Create Account →"}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login"
            className="text-blue-700 font-medium hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  )
}