"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CourseActionsProps = { courseId: string; owned: boolean; price: number };

export default function CourseActions({ courseId, owned, price }: CourseActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function enroll() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.message || "Could not enroll");
    router.push(`/dashboard/courses/${courseId}`);
    router.refresh();
  }

  async function checkout() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/payments/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
    const data = await response.json();
    if (response.ok && data.url) window.location.assign(data.url);
    else {
      setLoading(false);
      setMessage(data.message || "Could not start checkout");
    }
  }

  if (owned) return <span className="rounded-lg bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">Enrolled</span>;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {price > 0 ? (
          <button type="button" onClick={checkout} disabled={loading} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Opening checkout..." : `Buy for $${price.toFixed(2)}`}
          </button>
        ) : (
          <button type="button" onClick={enroll} disabled={loading} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Enrolling..." : "Enroll for free"}
          </button>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
    </div>
  );
}