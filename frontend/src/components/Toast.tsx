import { useEffect } from "react"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white
                     text-sm font-medium shadow-lg z-50
                     ${type === "success" ? "bg-green-600" : "bg-red-500"}`}>
      {message}
    </div>
  )
}