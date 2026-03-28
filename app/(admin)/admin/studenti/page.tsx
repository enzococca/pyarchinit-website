"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus } from "lucide-react";

interface CourseRef {
  id: string;
  title: string;
}

interface EnrollmentRef {
  id: string;
  courseId: string;
  status: string;
  createdAt: string;
  course: CourseRef;
}

interface Student {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  enrollments: EnrollmentRef[];
  completedLessons: number;
}

export default function AdminStudentiPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const manualEnroll = async () => {
    const userId = prompt("ID studente:");
    if (!userId) return;
    const courseId = prompt("ID corso:");
    if (!courseId) return;

    setEnrolling(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId }),
    });
    if (res.ok) {
      await loadStudents();
    }
    setEnrolling(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-mono text-teal">Studenti</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-sand/40">{students.length} studenti</span>
          <button
            onClick={manualEnroll}
            disabled={enrolling}
            className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition disabled:opacity-50"
          >
            <UserPlus size={16} />
            {enrolling ? "Iscrizione..." : "Iscrivi manualmente"}
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 text-sand/40">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessuno studente registrato.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-code-bg rounded-card border border-ochre/10 p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-medium text-sand">
                    {student.name ?? "Senza nome"}
                  </p>
                  <p className="text-xs text-sand/50">{student.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-sand/30">
                    {new Date(student.createdAt).toLocaleDateString("it-IT")}
                  </span>
                  <span className="text-xs text-sand/40 bg-sand/5 px-2 py-0.5 rounded-full border border-sand/10">
                    {student.completedLessons} lezioni completate
                  </span>
                </div>
              </div>

              {student.enrollments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {student.enrollments.map((enrollment) => (
                    <span
                      key={enrollment.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        enrollment.status === "ACTIVE"
                          ? "bg-teal/10 text-teal"
                          : enrollment.status === "COMPLETED"
                          ? "bg-ochre/10 text-ochre"
                          : "bg-terracotta/10 text-terracotta"
                      }`}
                    >
                      {enrollment.course.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
