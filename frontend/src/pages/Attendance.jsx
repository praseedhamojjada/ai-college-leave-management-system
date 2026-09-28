import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import api from "../api/api";

function getStatusConfig(status) {
  switch (status) {
    case "GOOD":
      return {
        label: "Good",
        className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        icon: CheckCircle2,
        barClass: "bg-emerald-500",
      };

    case "WATCH":
      return {
        label: "Watch",
        className: "bg-amber-50 text-amber-700 border-amber-100",
        icon: Clock3,
        barClass: "bg-amber-500",
      };

    case "AT RISK":
      return {
        label: "At Risk",
        className: "bg-red-50 text-red-700 border-red-100",
        icon: AlertTriangle,
        barClass: "bg-red-500",
      };

    default:
      return {
        label: status || "No Data",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        icon: Activity,
        barClass: "bg-slate-400",
      };
  }
}

function getAttendanceStatus(percentage) {
  if (percentage >= 85) return "GOOD";
  if (percentage >= 75) return "WATCH";
  return "AT RISK";
}

function Attendance({ user, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAttendance = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/attendance/my");
      setData(response.data);
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else {
        setError(
          "Unable to load attendance. Please check that the backend is running."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const overall = data?.overall || {};
  const subjects = data?.subjects || [];
  const attentionSubjects = data?.subjects_needing_attention || [];

  const overallPercentage = Number(
    overall.attendance_percentage ?? 0
  );

  const overallStatus = getAttendanceStatus(overallPercentage);
  const overallConfig = getStatusConfig(overallStatus);
  const OverallIcon = overallConfig.icon;

  const subjectSummary = useMemo(() => {
    if (!subjects.length) {
      return {
        best: null,
        lowest: null,
        average: 0,
      };
    }

    const sorted = [...subjects].sort(
      (a, b) =>
        Number(b.attendance_percentage) -
        Number(a.attendance_percentage)
    );

    const average =
      subjects.reduce(
        (sum, subject) =>
          sum + Number(subject.attendance_percentage || 0),
        0
      ) / subjects.length;

    return {
      best: sorted[0],
      lowest: sorted[sorted.length - 1],
      average: Number(average.toFixed(2)),
    };
  }, [subjects]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <main className="mx-auto max-w-[1600px] p-5 md:p-8">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <RefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading attendance...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Fetching your latest attendance records
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-[1600px] p-5 md:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <Activity size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Attendance
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Your detailed academic attendance overview
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAttendance(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700">
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Could not load attendance
              </p>
              <p className="mt-1 text-xs leading-5">{error}</p>
            </div>
          </div>
        )}

        {/* Student context */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {data?.student?.name || user?.full_name || "Student"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {data?.student?.email || user?.email || ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {data?.student?.year && (
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  Year {data.student.year}
                </span>
              )}
              {data?.student?.semester && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Semester {data.student.semester}
                </span>
              )}
              {data?.student?.section && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Section {data.student.section}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Overall hero */}
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex flex-col gap-7 md:flex-row md:items-center">
              <div className="flex justify-center md:w-52 md:shrink-0">
                <div
                  className="relative flex h-44 w-44 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#4f46e5 ${
                      Math.min(Math.max(overallPercentage, 0), 100) * 3.6
                    }deg, #e2e8f0 0deg)`,
                  }}
                >
                  <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                      {overallPercentage.toFixed(1)}%
                    </span>
                    <span className="mt-1 text-xs font-medium text-slate-400">
                      Overall
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${overallConfig.className}`}
                  >
                    <OverallIcon size={14} />
                    {overallConfig.label}
                  </span>

                  <span className="text-xs text-slate-400">
                    Current attendance
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  {overallPercentage >= 85
                    ? "Your attendance is in a healthy range."
                    : overallPercentage >= 75
                      ? "Keep an eye on your attendance."
                      : "Your attendance needs attention."}
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Attendance is calculated from your recorded classes
                  attended and total classes held across active subjects.
                </p>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${overallConfig.barClass}`}
                    style={{
                      width: `${Math.min(
                        Math.max(overallPercentage, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen size={19} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Class Summary
                </p>
                <h2 className="font-bold text-slate-900">
                  Attendance Snapshot
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SummaryRow
                label="Classes attended"
                value={overall.classes_attended ?? 0}
                icon={CheckCircle2}
              />
              <SummaryRow
                label="Classes absent"
                value={overall.classes_absent ?? 0}
                icon={TrendingDown}
              />
              <SummaryRow
                label="Total classes"
                value={overall.classes_held ?? 0}
                icon={BookOpen}
              />
              <SummaryRow
                label="Subjects"
                value={subjects.length}
                icon={Activity}
              />
            </div>
          </div>
        </section>

        {/* Subject insights */}
        {subjects.length > 0 && (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <InsightCard
              icon={TrendingUp}
              label="Highest attendance"
              value={
                subjectSummary.best
                  ? `${Number(
                      subjectSummary.best.attendance_percentage
                    ).toFixed(1)}%`
                  : "—"
              }
              description={
                subjectSummary.best?.subject_name || "No data"
              }
              className="text-emerald-600 bg-emerald-50"
            />

            <InsightCard
              icon={TrendingDown}
              label="Lowest attendance"
              value={
                subjectSummary.lowest
                  ? `${Number(
                      subjectSummary.lowest.attendance_percentage
                    ).toFixed(1)}%`
                  : "—"
              }
              description={
                subjectSummary.lowest?.subject_name || "No data"
              }
              className="text-amber-600 bg-amber-50"
            />

            <InsightCard
              icon={Activity}
              label="Subject average"
              value={`${subjectSummary.average.toFixed(1)}%`}
              description={`${subjects.length} active subjects`}
              className="text-indigo-600 bg-indigo-50"
            />
          </section>
        )}

        {/* Subject-wise attendance */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BookOpen size={19} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Subject-wise Attendance
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Attendance breakdown for each subject
                </p>
              </div>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BookOpen size={20} />
              </div>
              <p className="mt-4 font-semibold text-slate-700">
                No attendance records found
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Your attendance records will appear here once they are
                available.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {subjects.map((subject) => {
                const percentage = Number(
                  subject.attendance_percentage || 0
                );
                const config = getStatusConfig(subject.status);
                const StatusIcon = config.icon;

                return (
                  <div
                    key={subject.subject_code}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                          {subject.subject_code}
                        </p>
                        <h3 className="mt-1 text-sm font-bold leading-5 text-slate-900">
                          {subject.subject_name}
                        </h3>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.className}`}
                      >
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-bold text-slate-900">
                          {percentage.toFixed(1)}%
                        </span>
                        <p className="mt-1 text-xs text-slate-400">
                          {subject.classes_attended} attended of{" "}
                          {subject.classes_held} classes
                        </p>
                      </div>

                      <div className="text-right text-xs text-slate-400">
                        <p>{subject.classes_absent} absent</p>
                      </div>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${config.barClass}`}
                        style={{
                          width: `${Math.min(
                            Math.max(percentage, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Attention */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle size={19} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Subjects needing attention
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Subjects currently below the 75% attendance threshold.
                </p>
              </div>
            </div>

            {attentionSubjects.length === 0 ? (
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      No subjects require immediate attention.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700/70">
                      Keep maintaining consistent attendance across your
                      subjects.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {attentionSubjects.map((subject) => (
                  <div
                    key={subject.subject_code}
                    className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {subject.subject_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {subject.subject_code}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {Number(
                        subject.attendance_percentage || 0
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI guidance */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck
                    size={20}
                    className="text-indigo-300"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    CampusLeave AI
                  </p>
                  <h2 className="font-bold">
                    Attendance Insight
                  </h2>
                </div>
              </div>

              <p className="mt-6 text-sm leading-6 text-indigo-100/80">
                {overallPercentage >= 85
                  ? "Your current overall attendance is above the 85% healthy-range threshold. Continue attending classes consistently."
                  : overallPercentage >= 75
                    ? "Your attendance is between 75% and 85%. Keep monitoring subject-wise attendance before planning additional leave."
                    : "Your attendance is below 75%. Review the subjects requiring attention and discuss your situation with authorized college staff if needed."}
              </p>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-100/60">
                    Current attendance
                  </span>
                  <span className="text-sm font-bold">
                    {overallPercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{
                      width: `${Math.min(
                        Math.max(overallPercentage, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <p className="mt-5 text-[11px] leading-5 text-indigo-100/50">
                This insight is informational and based on the attendance
                data currently recorded in CampusLeave AI.
              </p>
            </div>
          </div>
        </section>

        <footer className="pb-6 pt-8 text-center text-xs text-slate-400">
          CampusLeave AI • Smart, transparent and AI-assisted college
          leave management
        </footer>
      </main>
    </div>
  );
}

function SummaryRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Icon size={16} className="text-indigo-500" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
  description,
  className,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}
      >
        <Icon size={18} />
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default Attendance;
