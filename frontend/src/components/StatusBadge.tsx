export default function StatusBadge({
  status
}: { status: "present" | "absent" }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
      ${status === "present"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-600"}`}>
      {status}
    </span>
  )
}