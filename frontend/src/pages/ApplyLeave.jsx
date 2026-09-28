import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import api from "../api/api";

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (end < start) return 0;

  return Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
}

function getAttendanceStatus(attendance) {
  if (attendance === null || attendance === undefined) {
    return {
      label: "Unknown",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (attendance < 75) {
    return {
      label: "Critical",
      className: "bg-red-100 text-red-700",
    };
  }

  if (attendance < 80) {
    return {
      label: "At Risk",
      className: "bg-amber-100 text-amber-700",
    };
  }

  return {
    label: "Healthy",
    className: "bg-emerald-100 text-emerald-700",
  };
}

function getApiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item.msg === "string") {
          const location = Array.isArray(item.loc)
            ? item.loc.join(" → ")
            : "";

          return location ? `${location}: ${item.msg}` : item.msg;
        }

        return null;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.msg === "string") {
      return detail.msg;
    }

    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function ApplyLeave({ user, dashboardData, onBack, onSuccess }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState("");

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentAttendance =
    dashboardData?.student?.total_attendance ?? null;

  const numberOfDays = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate]
  );

  const selectedLeaveType = useMemo(
    () =>
      leaveTypes.find(
        (type) =>
          String(type.leave_type_id) === String(leaveTypeId)
      ),
    [leaveTypes, leaveTypeId]
  );

  const estimatedAttendance = useMemo(() => {
    if (
      currentAttendance === null ||
      currentAttendance === undefined ||
      numberOfDays <= 0
    ) {
      return null;
    }

    // Frontend estimate only. Backend remains the source of truth.
    return Math.max(
      0,
      Math.min(100, Number(currentAttendance) - numberOfDays)
    );
  }, [currentAttendance, numberOfDays]);

  const attendanceStatus = getAttendanceStatus(estimatedAttendance);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaveTypes() {
      setLoadingTypes(true);
      setTypesError("");

      try {
        const response = await api.get("/leaves/types");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.leave_types ||
            response.data?.data ||
            [];

        if (!cancelled) {
          setLeaveTypes(data);
        }
      } catch (error) {
        console.error("Unable to load leave types:", error);

        if (!cancelled) {
          setTypesError(
            getApiErrorMessage(
              error,
              "Unable to load available leave types."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTypes(false);
        }
      }
    }

    loadLeaveTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError("");
    setSuccessMessage("");

    if (!leaveTypeId) {
      setSubmitError("Please select a leave type.");
      return;
    }

    if (!startDate || !endDate) {
      setSubmitError("Please select both start and end dates.");
      return;
    }

    if (numberOfDays <= 0) {
      setSubmitError(
        "End date must be on or after the start date."
      );
      return;
    }

    if (
      selectedLeaveType?.max_days &&
      numberOfDays > Number(selectedLeaveType.max_days)
    ) {
      setSubmitError(
        `${selectedLeaveType.type_name} allows a maximum of ${selectedLeaveType.max_days} day(s) per request.`
      );
      return;
    }

    if (reason.trim().length < 10) {
      setSubmitError(
        "Please provide a little more detail. The reason should contain at least 10 characters."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/leaves", {
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      console.log("Leave submitted:", response.data);

      setSuccessMessage(
        "Your leave request has been submitted successfully. AI analysis has been generated for faculty review."
      );

      setLeaveTypeId("");
      setStartDate("");
      setEndDate("");
      setReason("");

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data);
        }, 1000);
      }
    } catch (error) {
      console.error("Leave submission failed:", error);

      setSubmitError(
        getApiErrorMessage(
          error,
          "Unable to submit your leave request. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles size={18} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                CampusLeave AI
              </p>
              <p className="text-[11px] text-slate-500">
                Smart Leave Management
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">
              {user?.full_name || "Student"}
            </p>
            <p className="text-xs text-slate-500">Student</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <Sparkles size={14} />
            AI-Assisted Leave Application
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Apply for Leave
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Submit your leave request and let CampusLeave AI
            analyze the request, attendance impact, and policy
            signals before faculty review.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Leave Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Provide accurate information for your request.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div>
                <label
                  htmlFor="leave-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Leave Type
                </label>

                <select
                  id="leave-type"
                  value={leaveTypeId}
                  onChange={(event) => {
                    setLeaveTypeId(event.target.value);
                    setSubmitError("");
                    setSuccessMessage("");
                  }}
                  disabled={loadingTypes || submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingTypes
                      ? "Loading leave types..."
                      : "Select a leave type"}
                  </option>

                  {leaveTypes.map((type) => (
                    <option
                      key={type.leave_type_id}
                      value={type.leave_type_id}
                    >
                      {type.type_name}
                      {type.max_days
                        ? ` — max ${type.max_days} day(s)`
                        : ""}
                    </option>
                  ))}
                </select>

                {typesError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <TriangleAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                    <p className="text-xs leading-5 text-red-700">
                      {typesError}
                    </p>
                  </div>
                )}

                {selectedLeaveType?.description && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {selectedLeaveType.description}
                  </p>
                )}

                {selectedLeaveType?.requires_document && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Supporting documentation may be required for this leave type.
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="start-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Start Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(event) => {
                        const value = event.target.value;
                        setStartDate(value);

                        if (endDate && value > endDate) {
                          setEndDate("");
                        }

                        setSubmitError("");
                        setSuccessMessage("");
                      }}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="end-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    End Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="end-date"
                      type="date"
                      min={startDate || undefined}
                      value={endDate}
                      onChange={(event) => {
                        setEndDate(event.target.value);
                        setSubmitError("");
                        setSuccessMessage("");
                      }}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Leave Duration
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {startDate && endDate
                        ? `${formatDate(startDate)} → ${formatDate(endDate)}`
                        : "Select your leave dates"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {numberOfDays}
                    </p>

                    <p className="text-xs text-slate-500">
                      {numberOfDays === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="leave-reason"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Reason for Leave
                  </label>

                  <span className="text-xs text-slate-400">
                    {reason.length}/2000
                  </span>
                </div>

                <textarea
                  id="leave-reason"
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setSubmitError("");
                    setSuccessMessage("");
                  }}
                  maxLength={2000}
                  rows={6}
                  disabled={submitting}
                  placeholder="Explain why you need leave. Include relevant details that may help your faculty review the request."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  CampusLeave AI uses the reason to identify broad
                  categories such as medical, academic, emergency,
                  and personal leave.
                </p>
              </div>

              {submitError && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <TriangleAlert
                    size={19}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Submission issue
                    </p>
                    <p className="mt-1 text-sm leading-5 text-red-700">
                      {submitError}
                    </p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Leave submitted
                    </p>
                    <p className="mt-1 text-sm leading-5 text-emerald-700">
                      {successMessage}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loadingTypes ||
                    !!typesError
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Leave Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Current Attendance
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {currentAttendance !== null &&
                    currentAttendance !== undefined
                      ? `${Number(currentAttendance).toFixed(1)}%`
                      : "—"}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <CalendarDays size={22} />
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(currentAttendance) || 0)
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Current status
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    getAttendanceStatus(currentAttendance).className
                  }`}
                >
                  {getAttendanceStatus(currentAttendance).label}
                </span>
              </div>
            </section>

            <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Sparkles size={19} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Attendance Impact
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Estimated impact based on the selected leave duration.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Current</p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {currentAttendance !== null &&
                    currentAttendance !== undefined
                      ? `${Number(currentAttendance).toFixed(1)}%`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-400">Projected</p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {estimatedAttendance !== null
                      ? `${estimatedAttendance.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              {numberOfDays > 0 && estimatedAttendance !== null && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 ${attendanceStatus.className}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Attendance outlook
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {attendanceStatus.label}
                  </p>

                  <p className="mt-1 text-xs opacity-80">
                    {estimatedAttendance < 75
                      ? "This leave may significantly affect your attendance. Faculty review is important."
                      : estimatedAttendance < 80
                      ? "Your projected attendance is approaching the lower attendance range."
                      : "Your projected attendance remains in a relatively healthy range."}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600" />

                <h3 className="font-bold text-slate-900">
                  How AI Helps
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  "Classifies the broad reason category",
                  "Checks attendance-related risk",
                  "Evaluates policy compliance signals",
                  "Generates a recommendation for faculty review",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />

                    <p className="text-sm leading-5 text-slate-600">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] leading-5 text-slate-500">
                  AI provides decision support only. Final leave approval
                  or rejection remains with the authorized college reviewer.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default ApplyLeave;
