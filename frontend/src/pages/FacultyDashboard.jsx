import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import api from "../api/api";

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function scorePercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  const number = Number(value);
  return number <= 1 ? Math.round(number * 100) : Math.round(number);
}

function getRiskTone(value) {
  const score = scorePercent(value);
  if (score === null) return "slate";
  if (score >= 70) return "red";
  if (score >= 40) return "amber";
  return "green";
}

function getRecommendationTone(value) {
  const recommendation = String(value || "").toUpperCase();
  if (recommendation === "APPROVE") return "green";
  if (recommendation === "REJECT") return "red";
  return "amber";
}

function getRiskTextClass(value) {
  const tone = getRiskTone(value);
  if (tone === "red") return "text-red-600";
  if (tone === "amber") return "text-amber-600";
  if (tone === "green") return "text-emerald-600";
  return "text-slate-600";
}

function Badge({ children, tone = "slate" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone] || styles.slate}`}
    >
      {children}
    </span>
  );
}

function Metric({ label, value, tone = "slate" }) {
  const styles = {
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    slate: "text-slate-900",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${styles[tone] || styles.slate}`}>
        {value}
      </p>
    </div>
  );
}

export default function FacultyDashboard({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/leaves/pending");
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load pending leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;

    return requests.filter((request) =>
      [
        request.student_name,
        request.student_email,
        request.leave_type,
        request.reason,
        request.ai_analysis?.reason_category,
        request.ai_analysis?.recommendation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [requests, search]);

  const stats = useMemo(() => {
    const aiRequests = requests.filter((item) => item.ai_analysis);
    const highRisk = requests.filter(
      (item) =>
        Number(item.ai_analysis?.risk_score || 0) >= 0.7 ||
        Number(item.ai_analysis?.attendance_risk || 0) >= 0.7
    ).length;

    const averageConfidence = aiRequests.length
      ? Math.round(
          (aiRequests.reduce(
            (sum, item) => sum + Number(item.ai_analysis.confidence || 0),
            0
          ) /
            aiRequests.length) *
            100
        )
      : 0;

    return {
      total: requests.length,
      highRisk,
      aiCoverage: aiRequests.length,
      averageConfidence,
    };
  }, [requests]);

  const approve = async (leaveId) => {
    setActionLoading(`approve-${leaveId}`);
    setError("");

    try {
      await api.put(`/leaves/${leaveId}/approve`);
      setExpandedId(null);
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to approve this leave request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (leaveId) => {
    setRejectingId(leaveId);
    setRejectionReason("");
  };

  const reject = async (leaveId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    setActionLoading(`reject-${leaveId}`);
    setError("");

    try {
      await api.put(`/leaves/${leaveId}/reject`, {
        reason: rejectionReason.trim(),
      });

      setRejectingId(null);
      setRejectionReason("");
      setExpandedId(null);
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to reject this leave request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={23} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">CampusLeave AI</p>
              <p className="text-xs text-slate-500">Faculty Review Center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.full_name || "Faculty"}
              </p>
              <p className="text-xs text-slate-500">{user?.role || "FACULTY"}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <section className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-6 text-white shadow-xl shadow-indigo-100">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-indigo-100">
                <Sparkles size={18} />
                <span className="text-sm font-semibold">
                  AI-assisted academic workflow
                </span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Leave Review Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                Review student leave requests with attendance impact and
                AI-generated decision-support insights before making the final
                approval decision.
              </p>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh requests
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pending requests" value={stats.total} tone="blue" />
          <Metric label="High-risk signals" value={stats.highRisk} tone="red" />
          <Metric label="AI coverage" value={`${stats.aiCoverage}/${stats.total}`} tone="green" />
          <Metric label="Avg. AI confidence" value={`${stats.averageConfidence}%`} tone="amber" />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pending Leave Requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Requests are ordered from oldest to newest for review.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, type, or reason..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center p-8">
              <div className="text-center">
                <RefreshCw size={28} className="mx-auto animate-spin text-indigo-600" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading pending requests...
                </p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                {search ? "No matching requests" : "No pending requests"}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {search
                  ? "Try a different search term."
                  : "There are currently no leave requests waiting for review."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRequests.map((request) => {
                const ai = request.ai_analysis;
                const expanded = expandedId === request.leave_id;
                const recommendationTone = getRecommendationTone(
                  ai?.recommendation
                );

                return (
                  <div key={request.leave_id} className="p-5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : request.leave_id)
                      }
                      className="w-full text-left"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 sm:flex">
                            <UserRound size={20} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900">
                                {request.student_name}
                              </h3>
                              <Badge tone="blue">{request.leave_type}</Badge>
                              {ai && (
                                <Badge tone={recommendationTone}>
                                  AI: {ai.recommendation}
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {request.student_email}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock3 size={14} />
                                {formatDate(request.start_date)} –{" "}
                                {formatDate(request.end_date)}
                              </span>
                              <span>
                                {request.number_of_days}{" "}
                                {request.number_of_days === 1 ? "day" : "days"}
                              </span>
                              <span>
                                Attendance {request.attendance?.before ?? "—"}%
                                {" → "}
                                {request.attendance?.projected ?? "—"}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 xl:pl-6">
                          {ai ? (
                            <div className="hidden text-right sm:block">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                AI confidence
                              </p>
                              <p className="mt-1 text-lg font-bold text-slate-900">
                                {scorePercent(ai.confidence)}%
                              </p>
                            </div>
                          ) : (
                            <Badge>AI unavailable</Badge>
                          )}

                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            {expanded ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </span>
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="grid gap-5 lg:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <div className="flex items-center gap-2">
                              <FileText size={18} className="text-indigo-600" />
                              <h4 className="font-bold text-slate-900">
                                Request Details
                              </h4>
                            </div>

                            <dl className="mt-4 space-y-3 text-sm">
                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Reason
                                </dt>
                                <dd className="mt-1 leading-6 text-slate-700">
                                  {request.reason || "No reason provided."}
                                </dd>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Attendance before
                                  </dt>
                                  <dd className="mt-1 font-bold text-slate-900">
                                    {request.attendance?.before ?? "—"}%
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Projected
                                  </dt>
                                  <dd className="mt-1 font-bold text-amber-600">
                                    {request.attendance?.projected ?? "—"}%
                                  </dd>
                                </div>
                              </div>
                            </dl>
                          </div>

                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
                            <div className="flex items-center gap-2">
                              <Sparkles size={18} className="text-indigo-600" />
                              <h4 className="font-bold text-slate-900">
                                AI Review
                              </h4>
                            </div>

                            {ai ? (
                              <>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Badge tone="blue">
                                    {ai.reason_category || "OTHER"}
                                  </Badge>
                                  <Badge tone={recommendationTone}>
                                    Recommendation: {ai.recommendation || "REVIEW"}
                                  </Badge>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      Risk
                                    </p>
                                    <p className={`mt-1 font-bold ${getRiskTextClass(ai.risk_score)}`}>
                                      {scorePercent(ai.risk_score)}%
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      Attendance risk
                                    </p>
                                    <p className={`mt-1 font-bold ${getRiskTextClass(ai.attendance_risk)}`}>
                                      {scorePercent(ai.attendance_risk)}%
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      Compliance
                                    </p>
                                    <p className="mt-1 font-bold text-emerald-600">
                                      {scorePercent(ai.policy_compliance)}%
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-white p-3">
                                    <p className="text-[11px] font-semibold text-slate-400">
                                      Confidence
                                    </p>
                                    <p className="mt-1 font-bold text-emerald-600">
                                      {scorePercent(ai.confidence)}%
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                    AI explanation
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">
                                    {ai.explanation || "No explanation available."}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                AI analysis is not available for this request.
                                Review the request using the available student,
                                leave, and attendance information.
                              </div>
                            )}
                          </div>
                        </div>

                        {rejectingId === request.leave_id && (
                          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                            <label className="text-sm font-bold text-red-800">
                              Rejection reason
                            </label>
                            <textarea
                              value={rejectionReason}
                              onChange={(event) =>
                                setRejectionReason(event.target.value)
                              }
                              rows={3}
                              placeholder="Explain why this leave request is being rejected..."
                              className="mt-2 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                            />

                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason("");
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === `reject-${request.leave_id}`}
                                onClick={() => reject(request.leave_id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                <XCircle size={16} />
                                Confirm rejection
                              </button>
                            </div>
                          </div>
                        )}

                        {rejectingId !== request.leave_id && (
                          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              disabled={Boolean(actionLoading)}
                              onClick={() => openReject(request.leave_id)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              <XCircle size={17} />
                              Reject
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(actionLoading)}
                              onClick={() => approve(request.leave_id)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {actionLoading === `approve-${request.leave_id}` ? (
                                <RefreshCw size={17} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={17} />
                              )}
                              Approve Leave
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-bold">AI decision-support notice:</span>{" "}
            AI recommendations, risk scores, and confidence values are
            informational. The final leave decision remains with authorized
            college staff.
          </p>
        </div>
      </main>
    </div>
  );
}
