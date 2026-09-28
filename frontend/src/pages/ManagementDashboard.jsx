import { useEffect, useMemo, useState } from "react";

const CHART_COLORS = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
  cancelled: "#64748b",
  indigo: "#4f46e5",
  review: "#f59e0b",
};
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
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

const STATUS_META = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAttendanceTone(value) {
  const n = Number(value ?? 0);
  if (n >= 85) return "text-emerald-600";
  if (n >= 75) return "text-amber-600";
  return "text-red-600";
}

export default function ManagementDashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Overview");

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get("/dashboard/management");
      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
        return;
      }
      setError(
        err.response?.data?.detail ||
          "Unable to load the management dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Keep the sidebar highlight synchronized with the section currently in view.
  useEffect(() => {
    const sectionIds = [
      ["Overview", "overview"],
      ["Departments", "departments"],
      ["Attendance Risk", "attendance-risk"],
      ["AI Governance", "ai-governance"],
      ["Activity", "activity"],
    ];

    const sections = sectionIds
      .map(([label, id]) => {
        const element = document.getElementById(id);
        return element ? { label, element } : null;
      })
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          const match = sections.find(
            (section) => section.element === visible[0].target
          );
          if (match) setActiveSection(match.label);
        }
      },
      { rootMargin: "-88px 0px -58% 0px", threshold: [0.05, 0.2, 0.5] }
    );

    sections.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const leaveSummary = data?.leave_summary ?? {};
  const userSummary = data?.user_summary ?? {};
  const attendanceSummary = data?.attendance_summary ?? {};
  const aiSummary = data?.ai_summary ?? {};
  const departments = data?.department_statistics ?? [];
  const lowAttendance = attendanceSummary.low_attendance_students ?? [];
  const recentActivity = data?.recent_activity ?? [];

  const statusChart = useMemo(
    () => [
      { name: "Pending", value: leaveSummary.pending ?? 0, fill: CHART_COLORS.pending },
      { name: "Approved", value: leaveSummary.approved ?? 0, fill: CHART_COLORS.approved },
      { name: "Rejected", value: leaveSummary.rejected ?? 0, fill: CHART_COLORS.rejected },
      { name: "Cancelled", value: leaveSummary.cancelled ?? 0, fill: CHART_COLORS.cancelled },
    ],
    [leaveSummary]
  );

  const aiChart = useMemo(
    () => [
      { name: "Approve", value: aiSummary.approve_recommendations ?? 0, fill: CHART_COLORS.approved },
      { name: "Review", value: aiSummary.review_required ?? 0, fill: CHART_COLORS.review },
      { name: "Reject", value: aiSummary.reject_recommendations ?? 0, fill: CHART_COLORS.rejected },
    ],
    [aiSummary]
  );

  const departmentChart = useMemo(
    () =>
      departments.map((item) => ({
        name: item.department_code || `Dept ${item.department_id}`,
        total: item.total_leaves ?? 0,
        pending: item.pending ?? 0,
        approved: item.approved ?? 0,
        rejected: item.rejected ?? 0,
      })),
    [departments]
  );

  const navItems = [
    { label: "Overview", icon: BarChart3 },
    { label: "Departments", icon: GraduationCap },
    { label: "Attendance Risk", icon: AlertTriangle },
    { label: "AI Governance", icon: BrainCircuit },
    { label: "Activity", icon: Activity },
  ];

  const navigate = (label) => {
    setActiveSection(label);
    setSidebarOpen(false);

    requestAnimationFrame(() => {
      const target = document.getElementById(
        label.toLowerCase().replaceAll(" ", "-")
      );
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <RefreshCw size={20} className="animate-spin" />
          </div>
          <p className="mt-4 font-semibold text-slate-800">
            Loading management insights
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Preparing your institutional overview…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center border-b border-slate-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
            <GraduationCap size={22} />
          </div>
          <div className="ml-3">
            <p className="font-bold tracking-tight">CampusLeave</p>
            <p className="text-xs text-slate-400">AI Management</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-slate-800 px-5 py-5">
          <div className="rounded-2xl border border-indigo-400/10 bg-indigo-500/10 p-4">
            <div className="flex items-center gap-2 text-indigo-300">
              <ShieldCheck size={17} />
              <span className="text-xs font-semibold">
                {user?.role === "ADMIN" ? "Administrator" : "HOD Portal"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Institutional analytics, attendance risk and AI-assisted
              oversight.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <ChevronRight size={15} className="ml-auto opacity-70" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">
              {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.full_name || "Management"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.role || "Management"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Management Portal
              </p>
              <p className="text-sm font-semibold text-slate-800">
                CampusLeave AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
              title="Refresh dashboard"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.full_name}
                </p>
                <p className="text-xs text-slate-400">
                  {user?.role === "ADMIN" ? "Administrator" : "Head of Department"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {user?.full_name?.charAt(0)?.toUpperCase() || "M"}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertTriangle size={19} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Dashboard unavailable</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm"
              >
                Retry
              </button>
            </div>
          )}

          <section id="overview" className="scroll-mt-28">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                  <BrainCircuit size={14} />
                  Institutional intelligence
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Management Overview
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Monitor leave activity, attendance health and AI-assisted
                  decision signals across CampusLeave.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Signed in as</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {data?.management?.full_name || user?.full_name}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Users}
                label="Total Students"
                value={userSummary.total_students ?? 0}
                description="Registered student accounts"
                iconClass="bg-indigo-50 text-indigo-600"
              />
              <MetricCard
                icon={Clock3}
                label="Pending Leaves"
                value={leaveSummary.pending ?? 0}
                description="Awaiting authorized review"
                iconClass="bg-amber-50 text-amber-600"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Approved Leaves"
                value={leaveSummary.approved ?? 0}
                description="Completed approvals"
                iconClass="bg-emerald-50 text-emerald-600"
              />
              <MetricCard
                icon={Activity}
                label="Average Attendance"
                value={`${Number(attendanceSummary.average_attendance ?? 0).toFixed(1)}%`}
                description="Across student profiles"
                iconClass="bg-blue-50 text-blue-600"
              />
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Leave distribution
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Request status
                  </h2>
                </div>
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                  <BarChart3 size={19} />
                </div>
              </div>

              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChart} barSize={34}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {statusChart.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Population
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  User composition
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniMetric label="Students" value={userSummary.total_students ?? 0} />
                <MiniMetric label="Faculty" value={userSummary.total_faculty ?? 0} />
                <MiniMetric label="Total users" value={userSummary.total_users ?? 0} />
                <MiniMetric label="Leave requests" value={leaveSummary.total ?? 0} />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-800">
                    Governance snapshot
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  AI recommendations are decision-support signals. Authorized
                  staff remain responsible for final leave decisions.
                </p>
              </div>
            </div>
          </section>

          <section
            id="departments"
            className="mt-6 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Department analytics
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Leave activity by department
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {departments.length} departments tracked
              </span>
            </div>

            {departments.length === 0 ? (
              <EmptyState text="No department leave activity is available yet." />
            ) : (
              <div className="mt-5 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChart}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="total" name="Total leaves" fill={CHART_COLORS.indigo} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {departments.map((dept) => (
                    <div
                      key={dept.department_id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {dept.department_name || `Department ${dept.department_id}`}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            {dept.department_code || `ID ${dept.department_id}`} · HOD: {dept.hod_name || "Not assigned"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">
                          {dept.total_leaves ?? 0}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <SmallStatus label="Pending" value={dept.pending} />
                        <SmallStatus label="Approved" value={dept.approved} />
                        <SmallStatus label="Rejected" value={dept.rejected} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section
            id="attendance-risk"
            className="mt-6 scroll-mt-28 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                    Attendance watch
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Low-attendance students
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Calculated from attendance records
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                  <AlertTriangle size={19} />
                </div>
              </div>

              <div className="mt-5">
                {lowAttendance.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={17} />
                      <p className="text-sm font-semibold">
                        No students below the 75% threshold in the current profile data.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowAttendance.map((student) => (
                      <div
                        key={student.student_id}
                        className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {student.student_name || `Student #${student.student_id}`}
                          </p>
                          <p className="text-xs text-slate-400">
                            {student.registration_number || `User #${student.user_id}`} · {student.classes_attended ?? 0}/{student.classes_held ?? 0} classes attended
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold ${getAttendanceTone(
                            student.attendance
                          )}`}
                        >
                          {Number(student.attendance ?? 0).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Attendance context
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Institutional health
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniMetric
                  label="Average"
                  value={`${Number(attendanceSummary.average_attendance ?? 0).toFixed(1)}%`}
                />
                <MiniMetric
                  label="Below 75%"
                  value={lowAttendance.length}
                />
                <MiniMetric
                  label="Students"
                  value={userSummary.total_students ?? 0}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Activity size={18} />
                  <p className="text-sm font-bold">Why this matters</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Leave decisions can affect attendance eligibility. This view
                  helps authorized staff identify students who may need closer
                  attendance review before approving leave.
                </p>
              </div>
            </div>
          </section>

          <section
            id="ai-governance"
            className="mt-6 scroll-mt-28 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                    AI governance
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Recommendation distribution
                  </h2>
                </div>
                <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                  <BrainCircuit size={19} />
                </div>
              </div>

              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aiChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {aiChart.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <AIStat label="Approve" value={aiSummary.approve_recommendations ?? 0} />
                <AIStat label="Review" value={aiSummary.review_required ?? 0} />
                <AIStat label="Reject" value={aiSummary.reject_recommendations ?? 0} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI coverage
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Analysis health
              </h2>

              <div className="mt-5 space-y-3">
                <ProgressRow
                  label="AI analyses"
                  value={aiSummary.total_analyses ?? 0}
                  max={Math.max(leaveSummary.total ?? 0, aiSummary.total_analyses ?? 0, 1)}
                />
                <ProgressRow
                  label="Human review signals"
                  value={aiSummary.review_required ?? 0}
                  max={Math.max(aiSummary.total_analyses ?? 0, 1)}
                />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <p className="text-sm font-bold text-slate-800">
                    Human-in-the-loop policy
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  CampusLeave AI provides recommendations and risk signals;
                  authorized college staff retain final decision authority.
                </p>
              </div>
            </div>
          </section>

          <section
            id="activity"
            className="mt-6 scroll-mt-28 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Audit trail
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Recent system activity
                </h2>
              </div>
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Activity size={18} />
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <EmptyState text="No audit activity is available yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivity.slice(0, 10).map((activity) => (
                  <div
                    key={activity.audit_id}
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        {activity.action?.toLowerCase().includes("reject") ? (
                          <XCircle size={17} />
                        ) : activity.action?.toLowerCase().includes("approv") ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <FileText size={17} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {activity.action || "System action"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {activity.entity_type || "Entity"} #{activity.entity_id ?? "—"}
                          {" • "}User #{activity.user_id ?? "—"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer className="pb-6 pt-8 text-center text-xs text-slate-400">
            CampusLeave AI • Smart, transparent and AI-assisted college leave management
          </footer>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, description, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon size={19} />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

function SmallStatus({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-2 py-2 text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-700">{value ?? 0}</p>
    </div>
  );
}

function AIStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, max }) {
  const percentage = Math.min(100, Math.round((Number(value) / Number(max)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500">{label}</span>
        <span className="font-bold text-slate-700">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileText size={19} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-700">{text}</p>
    </div>
  );
}
