"use client";

import { GraduationCap, User } from "lucide-react";
import { Stat } from "./ui";
import { StudentData } from "@/types/childProfileTypes";

interface Props {
  student: StudentData;
  allergenCount: number;
  blockedCount: number;
}

export function StudentIdentityCard({
  student,
  allergenCount,
  blockedCount,
}: Props) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const classLabel =
    student.class ?
      `Grade ${student.class.grade} · Section ${student.class.section}`
    : null;

  return (
    <div
      className="rounded-2xl border p-5 flex items-center gap-4"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Avatar + status dot */}
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl font-bold text-blue-600 overflow-hidden border border-blue-500/20">
          {student.imageUrl ?
            <img
              src={student.imageUrl}
              alt={student.name}
              className="w-full h-full object-cover"
            />
          : initials}
        </div>
        <div
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-(--bg-card) ${
            student.orderingEnabled ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </div>

      {/* Name + class */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-(--text-primary) truncate leading-snug">
          {student.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          {classLabel && (
            <span className="flex items-center gap-1 text-xs text-(--text-secondary)">
              <GraduationCap size={11} className="text-(--text-muted)" />
              {classLabel}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-(--text-muted) font-mono">
            <User size={11} />
            {student.studentCode}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <Stat
          label="Allergens"
          value={allergenCount}
          color={allergenCount > 0 ? "#ef4444" : undefined}
        />
        <div className="w-px h-8 bg-(--border-card)" />
        <Stat label="Blocked" value={blockedCount} />
      </div>
    </div>
  );
}
