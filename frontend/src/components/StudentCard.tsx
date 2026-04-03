import React from 'react';
import StatusBadge from './StatusBadge';
import type { SessionDetail } from '../types';

interface StudentCardProps {
  student: SessionDetail;
  onToggle: (id: number, status: 'present' | 'absent') => void;
  isPending?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onToggle, isPending }) => {
  return (
    <div className={`relative bg-white rounded-3xl p-5 border-2 transition-all duration-300 group shadow-sm ${
      isPending 
        ? 'border-yellow-400 ring-2 ring-yellow-400/20 ring-offset-2' 
        : 'border-gray-50 hover:border-indigo-100 hover:shadow-xl'
    }`}>
      {isPending && (
        <div className="absolute -top-3 left-4 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
          PENDING SYNC
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-50 shadow-inner bg-gray-100">
            {student.profile_photo ? (
              <img
                src={`http://127.0.0.1:5000/${student.profile_photo}`}
                alt={student.name}
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${student.name}&background=6366f1&color=fff`)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-300">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1">
             <StatusBadge status={student.status} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{student.name}</h4>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 truncate">Roll: {student.roll_number}</p>
          <p className="text-[10px] font-black text-indigo-500/50 mt-0.5 truncate uppercase tracking-widest">ID: {student.student_id}</p>
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
        <button
          onClick={() => onToggle(student.student_id, student.status)}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            student.status === 'present'
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {student.status === 'present' ? 'Mark Absent' : 'Mark Present'}
        </button>
      </div>
    </div>
  );
};

export default StudentCard;
