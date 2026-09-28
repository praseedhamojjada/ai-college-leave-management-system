import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import api from "../api/api";

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
          return item.msg;
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

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSubmittedDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusConfig(status) {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        icon: CheckCircle2,
      };

    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-red-50 text-red-700 border-red-100",
        icon: XCircle,
      };

    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        icon: XCircle,
      };

    default:
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-100",
        icon: Clock3,
      };
  }
}

function MyLeaves({ user, onBack, onRefresh }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedLeaveId, setExpandedLeaveId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  async function loadLeaves(showFullLoader = true) {
    if (showFullLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const response = await api.get("/leaves/my");

      if (!Array.isArray(response.data)) {
        throw new Error("Unexpected response received from the server.");
      }

      setLeaves(response.data);
    } catch (requestError) {
      console.error("Unable to load my leaves:", requestError);

      setError(
        getApiErrorMessage(
          requestError,
          "Unable to load your leave requests. Please try again."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  const filteredLeaves = useMemo(() => {
    if (statusFilter === "ALL") {
      return leaves;
    }

    return leaves.filter((leave) => leave.status === statusFilter);
  }, [leaves, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: leaves.length,
      pending: leaves.filter((leave) => leave.status === "PENDING").length,
      approved: leaves.filter((leave) => leave.status === "APPROVED").length,
      rejected: leaves.filter((leave) => leave.status === "REJECTED").length,
      cancelled: leaves.filter((leave) => leave.status === "CANCELLED").length,
    };
  }, [leaves]);

  async function handleCancel(leaveId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this pending leave request?"
    );

    if (!confirmed) {
      return;
    }

    setCancellingId(leaveId);
    setCancelError("");

    try {
      await api.delete(`/leaves/${leaveId}`);

      setLeaves((currentLeaves) =>
        currentLeaves.map((leave) =>
          leave.leave_id === leaveId
            ? { ...leave, status: "CANCELLED" }
            : leave
        )
      );

      if (expandedLeaveId === leaveId) {
        setExpandedLeaveId(null);
      }

      if (onRefresh) {
        await onRefresh();
      }
    } catch (requestError) {
      console.error("Unable to cancel leave:", requestError);

      setCancelError(
        getApiErrorMessage(
          requestError,
          "Unable to cancel this leave request. Please try again."
        )
      );
    } finally {
      setCancellingId(null);
    }
  }

  function toggleExpanded(leaveId) {
    setExpandedLeaveId((currentId) =>
      currentId === leaveId ? null : leaveId
    );
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <FileText size={18} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                CampusLeave AI
              </p>
              <p className="text-[11px] text-slate-500">
                My Leave Requests
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
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <FileText size={14} />
              Leave History
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              My Leaves
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Track all your submitted leave requests, their current
              status, dates, attendance impact, and rejection details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLeaves(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            label="Total"
            value={counts.total}
            className="bg-indigo-50 text-indigo-700"
          />

          <SummaryCard
            label="Pending"
            value={counts.pending}
            className="bg-amber-50 text-amber-700"
          />

          <SummaryCard
            label="Approved"
            value={counts.approved}
            className="bg-emerald-50 text-emerald-700"
          />

          <SummaryCard
            label="Rejected"
            value={counts.rejected}
            className="bg-red-50 text-red-700"
          />

          <SummaryCard
            label="Cancelled"
            value={counts.cancelled}
            className="bg-slate-100 text-slate-600"
          />
        </section>

        {cancelError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {cancelError}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Leave Requests
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Data is loaded directly from your CampusLeave account.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["ALL", "All"],
                ["PENDING", "Pending"],
                ["APPROVED", "Approved"],
                ["REJECTED", "Rejected"],
                ["CANCELLED", "Cancelled"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    statusFilter === value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <Loader2 size={20} className="animate-spin text-indigo-600" />
                Loading your leave requests...
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XCircle size={21} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                Could not load leaves
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => loadLeaves()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <FileText size={21} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No leave requests found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {statusFilter === "ALL"
                  ? "You have not submitted any leave requests yet."
                  : `There are no ${statusFilter.toLowerCase()} leave requests.`}
              </p>

              <button
                type="button"
                onClick={onBack}
                className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredLeaves.map((leave) => {
                const statusConfig = getStatusConfig(leave.status);
                const StatusIcon = statusConfig.icon;
                const expanded = expandedLeaveId === leave.leave_id;
                const isCancelling = cancellingId === leave.leave_id;

                return (
                  <article
                    key={leave.leave_id}
                    className="p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <CalendarDays size={19} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">
                              {leave.leave_type_name || "Leave Request"}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusConfig.className}`}
                            >
                              <StatusIcon size={13} />
                              {statusConfig.label}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(leave.start_date)}
                            {" → "}
                            {formatDate(leave.end_date)}
                            {" • "}
                            {leave.number_of_days}{" "}
                            {leave.number_of_days === 1 ? "day" : "days"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Submitted {formatSubmittedDate(leave.submitted_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {leave.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(leave.leave_id)}
                            disabled={isCancelling}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isCancelling ? "Cancelling..." : "Cancel Leave"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpanded(leave.leave_id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          {expanded ? "Hide Details" : "View Details"}
                          {expanded ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-4">
                        <DetailCard
                          label="Reason"
                          value={leave.reason || "—"}
                          wide
                        />

                        <DetailCard
                          label="Attendance Before"
                          value={
                            leave.attendance_before !== null &&
                            leave.attendance_before !== undefined
                              ? `${Number(leave.attendance_before).toFixed(1)}%`
                              : "—"
                          }
                        />

                        <DetailCard
                          label="Projected Attendance"
                          value={
                            leave.projected_attendance !== null &&
                            leave.projected_attendance !== undefined
                              ? `${Number(leave.projected_attendance).toFixed(1)}%`
                              : "—"
                          }
                        />

                        <DetailCard
                          label="Leave ID"
                          value={`#${leave.leave_id}`}
                        />

                        {leave.rejection_reason && (
                          <div className="rounded-xl border border-red-100 bg-red-50 p-4 md:col-span-2 xl:col-span-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                              Rejection Reason
                            </p>

                            <p className="mt-2 text-sm leading-6 text-red-800">
                              {leave.rejection_reason}
                            </p>
                          </div>
                        )}

                        {leave.status === "PENDING" && (
                          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 md:col-span-2 xl:col-span-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                              Review Status
                            </p>

                            <p className="mt-1 text-sm leading-6 text-indigo-900">
                              Your request is waiting for review by an
                              authorized college staff member.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Leave status and attendance information are retrieved from the
          CampusLeave backend. Final approval decisions remain with
          authorized college staff.
        </p>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, className }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        {label}
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {label === "Total"
          ? "All requests"
          : `${label} requests`}
      </p>
    </div>
  );
}

function DetailCard({ label, value, wide = false }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${
        wide ? "md:col-span-2 xl:col-span-4" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default MyLeaves;
