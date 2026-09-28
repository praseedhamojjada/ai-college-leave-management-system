import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/api";

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function percentage(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "—";
}

function riskScoreColor(value) {
  const number = Number(value);
  if (number >= 0.75) return "text-red-600";
  if (number >= 0.5) return "text-amber-600";
  return "text-emerald-600";
}

function positiveScoreColor(value) {
  const number = Number(value);
  if (number >= 0.75) return "text-emerald-600";
  if (number >= 0.5) return "text-amber-600";
  return "text-red-600";
}

function progressColor(value) {
  const number = Number(value);
  if (number >= 0.75) return "bg-emerald-500";
  if (number >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

function riskProgressColor(value) {
  const number = Number(value);
  if (number >= 0.75) return "bg-red-500";
  if (number >= 0.5) return "bg-amber-500";
  return "bg-emerald-500";
}

function recommendationConfig(value) {
  const recommendation = String(value || "").toUpperCase();

  if (recommendation === "APPROVE") {
    return {
      label: "Approve",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    };
  }

  if (recommendation === "REJECT") {
    return {
      label: "Reject",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    };
  }

  return {
    label: "Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  };
}

function riskLabel(value) {
  const number = Number(value);
  if (number >= 0.75) return "High";
  if (number >= 0.5) return "Moderate";
  return "Low";
}

function riskBadge(value) {
  const number = Number(value);
  if (number >= 0.75) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (number >= 0.5) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function MetricBar({ label, value, inverse = false }) {
  const numeric = Math.max(0, Math.min(Number(value) || 0, 1));
  const display = `${Math.round(numeric * 100)}%`;
  const bar = inverse ? 1 - numeric : numeric;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`text-xs font-bold ${inverse ? positiveScoreColor(numeric) : riskScoreColor(numeric)}`}>
          {display}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${inverse ? progressColor(numeric) : riskProgressColor(numeric)}`}
          style={{ width: `${bar * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function AIInsights({ user, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const loadInsights = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");
      const response = await api.get("/ai/my");
      setData(response.data);

      if (
        response.data?.insights?.length &&
        selectedId === null
      ) {
        setSelectedId(response.data.insights[0].analysis_id);
      }
    } catch (err) {
      console.error("Failed to load AI insights:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load AI insights right now. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insights = data?.insights || [];
  const selected =
    insights.find((item) => item.analysis_id === selectedId) ||
    insights[0] ||
    null;

  const summary = useMemo(() => {
    if (!insights.length) {
      return {
        confidence: 0,
        averageRisk: 0,
        recommendationCounts: {},
        categories: [],
      };
    }

    const average = (key) =>
      insights.reduce((sum, item) => sum + Number(item[key] || 0), 0) /
      insights.length;

    const recommendationCounts = insights.reduce((acc, item) => {
      const key = String(item.recommendation || "REVIEW").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const categoryCounts = insights.reduce((acc, item) => {
      const key = item.reason_category || "OTHER";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      confidence: average("confidence"),
      averageRisk: average("risk_score"),
      recommendationCounts,
      categories: Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }, [insights]);

  const categoryData = summary.categories.map((item) => ({
    ...item,
    name: item.name.replaceAll("_", " "),
  }));

  const riskChartData = insights
    .slice(0, 6)
    .map((item) => ({
      name: `#${item.leave_id}`,
      risk: Math.round(Number(item.risk_score || 0) * 100),
      compliance: Math.round(Number(item.policy_compliance || 0) * 100),
    }))
    .reverse();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 md:p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-5 w-28 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-72 rounded bg-slate-200" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <div className="mt-6 h-80 rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <BrainCircuit size={22} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                  CampusLeave AI
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  AI Insights
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Intelligent analysis of your leave requests, attendance impact,
                  and policy signals.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadInsights(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load AI insights</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Overview */}
        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Attendance
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {Number(data?.student?.attendance || 0).toFixed(1)}%
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Activity size={21} />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    Math.max(Number(data?.student?.attendance || 0), 0),
                    100
                  )}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {data?.student?.classes_attended || 0} attended of{" "}
              {data?.student?.classes_held || 0} classes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Analyses
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {data?.count || 0}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Sparkles size={21} />
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Leave requests with available AI analysis
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Average AI Confidence
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {percentage(summary.confidence)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ShieldCheck size={21} />
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Confidence in the generated analysis, not approval certainty
            </p>
          </div>
        </section>

        {insights.length === 0 ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BrainCircuit size={26} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No AI insights yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Once a leave request receives an AI analysis, its insights will
              appear here.
            </p>
          </section>
        ) : (
          <>
            {/* Analytics */}
            <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Risk & Compliance
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Leave analysis signals
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Comparison of AI risk and policy-compliance scores for recent
                    analyzed requests.
                  </p>
                </div>

                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskChartData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar
                        dataKey="risk"
                        name="Risk"
                        fill="#6366f1"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="compliance"
                        name="Compliance"
                        fill="#10b981"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Leave Categories
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Reason distribution
                </h2>

                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={
                              [
                                "#6366f1",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                              ][index % 5]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {categoryData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-600">
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Selected analysis */}
            {selected && (
              <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-white p-5 md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                          AI Analysis
                        </span>
                        <span className="text-xs text-slate-400">
                          Leave #{selected.leave_id}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-slate-900">
                        {selected.leave_type}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(selected.start_date)} –{" "}
                        {formatDate(selected.end_date)} ·{" "}
                        {selected.number_of_days}{" "}
                        {selected.number_of_days === 1 ? "day" : "days"}
                      </p>
                    </div>

                    {(() => {
                      const config = recommendationConfig(selected.recommendation);
                      const Icon = config.icon;

                      return (
                        <div
                          className={`inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${config.className}`}
                        >
                          <Icon size={17} />
                          AI Recommendation: {config.label}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Analysis scores
                    </p>

                    <div className="mt-5 space-y-5">
                      <MetricBar
                        label="Risk score"
                        value={selected.risk_score}
                      />
                      <MetricBar
                        label="Attendance risk"
                        value={selected.attendance_risk}
                      />
                      <MetricBar
                        label="Policy compliance"
                        value={selected.policy_compliance}
                        inverse
                      />
                      <MetricBar
                        label="AI confidence"
                        value={selected.confidence}
                        inverse
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2">
                      <BrainCircuit size={18} className="text-indigo-600" />
                      <p className="text-sm font-bold text-slate-900">
                        Why the AI generated this recommendation
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {selected.explanation}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Reason category
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {selected.reason_category?.replaceAll("_", " ")}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Urgency
                        </p>
                        <p className={`mt-1 text-sm font-bold text-amber-600`}>
                          {percentage(selected.urgency_score)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Attendance impact
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {selected.attendance_before != null
                            ? `${Number(selected.attendance_before).toFixed(1)}% → ${Number(
                                selected.projected_attendance
                              ).toFixed(1)}%`
                            : "Not available"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Risk level
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-bold ${riskBadge(
                            selected.risk_score
                          )}`}
                        >
                          {riskLabel(selected.risk_score)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Analysis history */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" />
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Recent AI Analyses
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Select an analysis to view its detailed explanation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {insights.map((item) => {
                  const config = recommendationConfig(item.recommendation);
                  const Icon = config.icon;
                  const active = item.analysis_id === selected?.analysis_id;

                  return (
                    <button
                      key={item.analysis_id}
                      type="button"
                      onClick={() => setSelectedId(item.analysis_id)}
                      className={`flex w-full flex-col gap-4 p-5 text-left transition md:flex-row md:items-center md:justify-between ${
                        active
                          ? "bg-indigo-50/60"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">
                            {item.leave_type}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {item.reason_category?.replaceAll("_", " ")}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(item.start_date)} –{" "}
                          {formatDate(item.end_date)} · Leave #{item.leave_id}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${config.className}`}
                        >
                          <Icon size={14} />
                          {config.label}
                        </span>

                        <span
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${riskBadge(
                            item.risk_score
                          )}`}
                        >
                          Risk {percentage(item.risk_score)}
                        </span>

                        <span className="text-xs font-semibold text-slate-400">
                          {percentage(item.confidence)} confidence
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* AI notice */}
            <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-indigo-950">
                    AI Decision Support
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-indigo-900/70">
                    CampusLeave AI analyzes leave reasons, duration, attendance
                    impact, and policy signals to provide decision-support
                    insights. AI recommendations do not approve or reject your
                    leave. Final decisions remain with authorized college staff.
                  </p>
                  <p className="mt-3 text-[11px] font-medium text-indigo-700/60">
                    Model: {selected?.model_name || "CampusLeave AI"}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        <p className="pb-4 pt-6 text-center text-[11px] text-slate-400">
          CampusLeave AI · {user?.full_name || "Student"} · AI-generated insights
          are informational.
        </p>
      </div>
    </div>
  );
}
