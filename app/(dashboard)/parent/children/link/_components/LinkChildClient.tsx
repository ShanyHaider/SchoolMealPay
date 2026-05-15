"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestParentChildLink } from "@/db/actions/Students";
import { Search, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export function LinkChildClient({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentCode.trim()) return;

    setStatus("idle");
    setErrorMsg("");

    startTransition(async () => {
      try {
        // requestParentChildLink takes parentId and studentId
        // In a real flow you would first look up the student by studentCode
        // For now we pass studentCode as the studentId lookup key
        await requestParentChildLink(parentId, studentCode.trim());
        setStatus("success");
        setTimeout(() => router.push("/parent/children"), 2000);
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error ?
            err.message
          : "Student not found. Please check the ID and try again.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* How it works */}
      <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          How it works
        </p>
        <div className="flex flex-col gap-3">
          {[
            {
              step: "1",
              text: "Enter your child's student ID provided by the school",
            },
            {
              step: "2",
              text: "A link request is sent to the school administrator",
            },
            {
              step: "3",
              text: "Once approved, you'll see your child's profile here",
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Student ID
          </label>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="e.g. STU-2024-001"
              required
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>
          <p className="text-xs text-gray-400">
            The student ID is printed on your child's school card or provided by
            the school office.
          </p>
        </div>

        {/* Error */}
        {status === "error" && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle
              size={16}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle2
              size={16}
              className="text-green-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">
                Request sent!
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
                Waiting for school admin approval. Redirecting...
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !studentCode.trim() || status === "success"}
          className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ?
            <>
              <span className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              Searching...
            </>
          : <>
              <UserCheck size={16} />
              Send link request
            </>
          }
        </button>
      </form>
    </div>
  );
}
