import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-blue-900 font-bold text-xl">AttendAI</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login"
              className="px-4 py-2 border border-blue-700 text-blue-700
                         rounded-lg text-sm font-medium hover:bg-blue-50">
              Login
            </Link>
            <Link to="/register"
              className="px-4 py-2 bg-blue-800 text-white rounded-lg
                         text-sm font-medium hover:bg-blue-900">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs
                         font-semibold px-4 py-2 rounded-full mb-6">
          AI-Powered Face Recognition
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
          Attendance That Takes<br />
          <span className="text-blue-700">Itself</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
          Upload one classroom photo and our AI automatically detects every
          student's face and marks attendance in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register"
            className="px-8 py-4 bg-blue-800 text-white rounded-xl
                       font-bold text-sm hover:bg-blue-900">
            Get Started Free →
          </Link>
          <Link to="/login"
            className="px-8 py-4 border border-gray-300 text-gray-700
                       rounded-xl font-bold text-sm hover:border-gray-400">
            Login to Dashboard
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-blue-800 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "99%", label: "Face Recognition Accuracy" },
            { value: "< 3s", label: "Attendance Per Class" },
            { value: "Zero", label: "Manual Work Required" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-4xl font-extrabold text-white mb-2">
                {stat.value}
              </p>
              <p className="text-blue-200 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          How It Works
        </h2>
        <p className="text-center text-gray-400 text-sm mb-16">
          Three simple steps to fully automated attendance
        </p>
        <div className="grid grid-cols-3 gap-8">
          {[
            {
              icon: "📸",
              step: "01",
              title: "Enroll Student Faces",
              desc: "Students upload 3 photos. AI extracts and stores their face embeddings securely.",
            },
            {
              icon: "🏫",
              step: "02",
              title: "Capture Classroom",
              desc: "Teacher uploads or captures one photo of the classroom during class.",
            },
            {
              icon: "✅",
              step: "03",
              title: "Attendance Auto-Marked",
              desc: "AI detects all faces, matches them, and marks present/absent instantly.",
            },
          ].map((item, i) => (
            <div key={i}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50
                                 px-2 py-1 rounded-full">
                  Step {item.step}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Built For Everyone
          </h2>
          <div className="grid grid-cols-2 gap-8">
            {[
              {
                icon: "👨‍🏫",
                role: "Teachers",
                color: "bg-blue-800",
                features: [
                  "Create and manage classes",
                  "Take attendance via photo or camera",
                  "View present/absent student cards",
                  "Manually override any record",
                  "Full session history & reports",
                ],
              },
              {
                icon: "👨‍🎓",
                role: "Students",
                color: "bg-gray-900",
                features: [
                  "Enroll face with 3 photos",
                  "Update profile info & photo",
                  "View day-wise attendance records",
                  "Track attendance percentage",
                  "Get marked automatically",
                ],
              },
            ].map((item, i) => (
              <div key={i}
                className="bg-white rounded-2xl border border-gray-200
                           shadow-sm overflow-hidden">
                <div className={`${item.color} px-8 py-6`}>
                  <span className="text-4xl">{item.icon}</span>
                  <h3 className="text-white font-bold text-xl mt-2">
                    {item.role}
                  </h3>
                </div>
                <ul className="px-8 py-6 space-y-3">
                  {item.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3
                                           text-sm text-gray-600">
                      <span className="text-green-500 font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-8 text-center">
        <p className="text-gray-400 text-sm">
          © 2025 AttendAI — AI-Powered Attendance System
        </p>
      </footer>

    </div>
  )
}