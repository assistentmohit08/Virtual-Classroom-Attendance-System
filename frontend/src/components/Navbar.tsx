import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-blue-900 font-bold text-xl">AttendAI</span>
          {user && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium
                             px-2 py-1 rounded-full ml-2 capitalize">
              {user.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-gray-600 text-sm">
                👋 <strong>{user.name}</strong>
              </span>
              {user.role === "teacher" && (
                <Link to="/teacher/report"
                  className="px-4 py-2 border border-blue-700 text-blue-700
                             rounded-lg text-sm font-medium hover:bg-blue-50">
                  Reports
                </Link>
              )}
              <button onClick={handleLogout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg
                           text-sm font-medium hover:bg-red-100">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}