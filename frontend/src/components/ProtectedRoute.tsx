import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "./LoadingSpinner"

interface Props {
  children: React.ReactNode
  role: "teacher" | "student"
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return (
    <Navigate to={`/${user.role}/dashboard`} replace />
  )

  return <>{children}</>
}