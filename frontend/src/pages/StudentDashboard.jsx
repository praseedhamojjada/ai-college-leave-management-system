import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { useMemo, useState } from "react";

import ApplyLeave from "./ApplyLeave";
import MyLeaves from "./MyLeaves";
import Attendance from "./Attendance";
import AIInsights from "./AIInsights";
import Notifications from "./Notifications";

function StudentDashboard({
  user,
  dashboardData,
  loading,
  onRefresh,
  onLogout,
  onApplyLeave,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard");

  const leaveSummary = dashboardData?.leave_summary || {};
  const recentLeaves = dashboardData?.recent_leaves || [];
  const student = dashboardData?.student || {};
  const unreadNotifications =
    dashboardData?.unread_notifications ?? 0;

  const attendance = student?.total_attendance ?? 0;

  const attendanceStatus = useMemo(() => {
    if (attendance >= 85) {
      return {
        label: "Good",
        description: "Your attendance is in a healthy range.",
        className: "bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
      };
    }

    if (attendance >= 75) {
      return {
        label: "Watch",
        description: "Keep an eye on your attendance.",
        className: "bg-amber-50 text-amber-700",
        icon: AlertTriangle,
      };
    }

    return {
      label: "At Risk",
      description: "Your attendance may require attention.",
      className: "bg-red-50 text-red-700",
      icon: AlertTriangle,
    };
  }, [attendance]);

  const AttendanceIcon = attendanceStatus.icon;

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Apply Leave",
      icon: Plus,
    },
    {
      label: "My Leaves",
      icon: FileText,
    },
    {
      label: "Attendance",
      icon: Activity,
    },
    {
      label: "AI Insights",
      icon: BrainCircuit,
    },
    {
      label: "Notifications",
      icon: Bell,
      badge: unreadNotifications,
    },
    {
      label: "Profile",
      icon: UserRound,
    },
  ];

  const handleNavigation = (label) => {
    console.log("Navigation clicked:", label);

    setSidebarOpen(false);

    if (label === "Apply Leave") {
      setActiveSection("Apply Leave");
      return;
    }

    setActiveSection(label);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "APPROVED":
        return {
          label: "Approved",
          className: "bg-emerald-50 text-emerald-700",
          icon: CheckCircle2,
        };

      case "REJECTED":
        return {
          label: "Rejected",
          className: "bg-red-50 text-red-700",
          icon: XCircle,
        };

      case "CANCELLED":
        return {
          label: "Cancelled",
          className: "bg-slate-100 text-slate-600",
          icon: XCircle,
        };

      default:
        return {
          label: "Pending",
          className: "bg-amber-50 text-amber-700",
          icon: Clock3,
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatLeaveType = (leave) => {
    return (
      leave.leave_type_name ||
      leave.leave_type ||
      "Leave Request"
    );
  };

  /*
   * -------------------------------------------------------------
   * APPLY LEAVE PAGE
   * -------------------------------------------------------------
   */

  if (activeSection === "Apply Leave") {
    return (
      <ApplyLeave
        user={user}
        dashboardData={dashboardData}
        onBack={() => setActiveSection("Dashboard")}
        onSuccess={async () => {
          await onRefresh();
          setActiveSection("Dashboard");
          setSidebarOpen(false);
        }}
      />
    );
  }

  /*
   * -------------------------------------------------------------
   * MY LEAVES PAGE
   * -------------------------------------------------------------
   */

  if (activeSection === "My Leaves") {
    return (
      <MyLeaves
        user={user}
        onBack={() => setActiveSection("Dashboard")}
        onRefresh={onRefresh}
      />
    );
  }

  /*
   * -------------------------------------------------------------
   * ATTENDANCE PAGE
   * -------------------------------------------------------------
   */

  if (activeSection === "Attendance") {
    return (
      <Attendance
        user={user}
        onBack={() => setActiveSection("Dashboard")}
      />
    );
  }

  if (activeSection === "AI Insights") {
    return (
      <AIInsights
        user={user}
        onBack={() => setActiveSection("Dashboard")}
      />
    );
  }

  if (activeSection === "Notifications") {
    return (
      <Notifications
        user={user}
        onBack={() => setActiveSection("Dashboard")}
      />
    );
  }

  /*
   * -------------------------------------------------------------
   * OTHER SECTIONS
   * -------------------------------------------------------------
   *
   * These sections will be implemented one by one.
   * For now, keep the existing dashboard available.
   */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* =========================================================
          MOBILE OVERLAY
      ========================================================= */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Logo */}
        <div className="flex h-20 items-center border-b border-slate-800 px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
            <GraduationCap size={22} />
          </div>

          <div className="ml-3">
            <p className="font-bold tracking-tight">
              CampusLeave
            </p>

            <p className="text-xs text-slate-400">
              AI Management
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">

          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavigation(item.label)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon size={18} />

                <span>{item.label}</span>

                {item.badge > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && !item.badge && (
                  <ChevronRight
                    size={15}
                    className="ml-auto opacity-70"
                  />
                )}
              </button>
            );
          })}

        </nav>

        {/* AI card */}
        <div className="mx-4 mb-4 rounded-2xl border border-indigo-400/10 bg-indigo-500/10 p-4">

          <div className="flex items-center gap-2 text-indigo-300">
            <BrainCircuit size={17} />

            <span className="text-xs font-semibold">
              CampusLeave AI
            </span>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            AI insights assist with leave decisions. Final approval
            remains with authorized college staff.
          </p>

        </div>

        {/* User / logout */}
        <div className="border-t border-slate-800 p-4">

          <div className="flex items-center gap-3 rounded-xl p-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">
              {user?.full_name?.charAt(0)?.toUpperCase() || "S"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.full_name || "Student"}
              </p>

              <p className="truncate text-xs text-slate-500">
                Student
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

      {/* =========================================================
          MAIN AREA
      ========================================================= */}
      <div className="min-h-screen lg:pl-72">

        {/* Top bar */}
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
                Student Portal
              </p>

              <p className="text-sm font-semibold text-slate-800">
                CampusLeave AI
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
              title="Refresh dashboard"
            >
              <TrendingUp
                size={18}
                className={loading ? "animate-pulse" : ""}
              />
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("Notifications")}
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
            >
              <Bell size={18} />

              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.full_name}
                </p>

                <p className="text-xs text-slate-400">
                  {user?.email}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {user?.full_name?.charAt(0)?.toUpperCase() || "S"}
              </div>

            </div>

          </div>

        </header>

        {/* Content */}
        <main className="mx-auto max-w-[1600px] p-5 md:p-8">

          {/* Greeting */}
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                <SparklesIcon />
                AI-assisted student portal
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Good morning, {user?.full_name?.split(" ")[0] || "Student"} 👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Here's an overview of your attendance, leave requests and
                campus activity.
              </p>

            </div>

            <button
              type="button"
              onClick={() => handleNavigation("Apply Leave")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Apply for Leave
            </button>

          </div>

          {/* =====================================================
              STAT CARDS
          ===================================================== */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              icon={FileText}
              label="Total Leaves"
              value={leaveSummary.total ?? 0}
              description="All submitted requests"
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <StatCard
              icon={Clock3}
              label="Pending"
              value={leaveSummary.pending ?? 0}
              description="Awaiting review"
              iconClass="bg-amber-50 text-amber-600"
            />

            <StatCard
              icon={CheckCircle2}
              label="Approved"
              value={leaveSummary.approved ?? 0}
              description="Approved requests"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon={Activity}
              label="Attendance"
              value={`${Number(attendance).toFixed(1)}%`}
              description={attendanceStatus.label}
              iconClass={
                attendance >= 85
                  ? "bg-emerald-50 text-emerald-600"
                  : attendance >= 75
                    ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-600"
              }
            />

          </section>

          {/* =====================================================
              ATTENDANCE + AI
          ===================================================== */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">

            {/* Attendance card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-start justify-between">

                <div>
                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Activity size={18} />
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        Attendance Overview
                      </h2>

                      <p className="text-xs text-slate-400">
                        Current attendance status
                      </p>
                    </div>

                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${attendanceStatus.className}`}
                >
                  <AttendanceIcon size={14} />
                  {attendanceStatus.label}
                </div>

              </div>

              <div className="mt-8 grid gap-8 md:grid-cols-[180px_1fr] md:items-center">

                {/* Circular percentage */}
                <div className="flex justify-center">

                  <div
                    className="relative flex h-40 w-40 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#4f46e5 ${
                        Math.min(Number(attendance), 100) * 3.6
                      }deg, #e2e8f0 0deg)`,
                    }}
                  >
                    <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">

                      <span className="text-3xl font-bold text-slate-900">
                        {Number(attendance).toFixed(1)}%
                      </span>

                      <span className="mt-1 text-xs text-slate-400">
                        Attendance
                      </span>

                    </div>
                  </div>

                </div>

                {/* Details */}
                <div>

                  <p className="text-sm leading-6 text-slate-500">
                    {attendanceStatus.description}
                  </p>

                  <div className="mt-5 space-y-3">

                    <AttendanceMetric
                      label="Attendance status"
                      value={attendanceStatus.label}
                    />

                    <AttendanceMetric
                      label="Leave requests"
                      value={leaveSummary.total ?? 0}
                    />

                    <AttendanceMetric
                      label="Pending requests"
                      value={leaveSummary.pending ?? 0}
                    />

                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigation("Attendance")}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View attendance details
                    <ChevronRight size={16} />
                  </button>

                </div>

              </div>

            </div>

            {/* AI card */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">

              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <BrainCircuit
                        size={21}
                        className="text-indigo-300"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                        AI Insights
                      </p>

                      <h2 className="mt-0.5 font-bold">
                        Smart Leave Assistant
                      </h2>
                    </div>

                  </div>

                  <SparklesIcon />

                </div>

                <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">

                  <div className="flex items-start gap-3">

                    <ShieldCheck
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-300"
                    />

                    <div>
                      <p className="text-sm font-semibold">
                        Attendance-aware analysis
                      </p>

                      <p className="mt-1 text-xs leading-5 text-indigo-100/70">
                        CampusLeave AI considers leave duration and
                        attendance impact when generating insights.
                      </p>
                    </div>

                  </div>

                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-100/60">
                      Current attendance
                    </span>

                    <span className="text-sm font-bold">
                      {Number(attendance).toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">

                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all"
                      style={{
                        width: `${Math.min(
                          Math.max(Number(attendance), 0),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

                <p className="mt-5 text-[11px] leading-5 text-indigo-100/50">
                  AI recommendations are decision-support information.
                  Final leave decisions remain with authorized college
                  staff.
                </p>

              </div>

            </div>

          </section>

          {/* =====================================================
              RECENT LEAVES
          ===================================================== */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">
                  <FileText
                    size={18}
                    className="text-indigo-600"
                  />

                  <h2 className="font-bold text-slate-900">
                    Recent Leave Requests
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Your latest leave applications
                </p>

              </div>

              <button
                type="button"
                onClick={() => handleNavigation("My Leaves")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all
                <ChevronRight size={16} />
              </button>

            </div>

            {recentLeaves.length === 0 ? (
              <div className="p-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FileText size={20} />
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No leave requests yet
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Your recent leave applications will appear here.
                </p>

              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {recentLeaves.slice(0, 5).map((leave) => {

                  const statusConfig =
                    getStatusConfig(leave.status);

                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={leave.leave_id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <CalendarDays size={19} />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {formatLeaveType(leave)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(leave.start_date)}
                            {" — "}
                            {formatDate(leave.end_date)}
                            {" • "}
                            {leave.number_of_days || 0} day
                            {leave.number_of_days === 1 ? "" : "s"}
                          </p>

                        </div>

                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">

                        <div className="hidden text-right md:block">

                          <p className="text-xs text-slate-400">
                            Submitted
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {formatDate(leave.submitted_at)}
                          </p>

                        </div>

                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusConfig.className}`}
                        >
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </section>

          {/* =====================================================
              QUICK ACTIONS
          ===================================================== */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">

            <QuickAction
              icon={Plus}
              title="Apply for Leave"
              description="Submit a new leave request."
              onClick={() => handleNavigation("Apply Leave")}
            />

            <QuickAction
              icon={BookOpen}
              title="View Attendance"
              description="Check your attendance details."
              onClick={() => handleNavigation("Attendance")}
            />

            <QuickAction
              icon={BrainCircuit}
              title="AI Insights"
              description="Understand your leave patterns."
              onClick={() => handleNavigation("AI Insights")}
            />

          </section>

          {/* Footer */}
          <footer className="pb-6 pt-8 text-center text-xs text-slate-400">
            CampusLeave AI • Smart, transparent and AI-assisted college
            leave management
          </footer>

        </main>

      </div>

    </div>
  );
}

/* ===============================================================
   COMPONENTS
=============================================================== */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>

        <TrendingUp
          size={16}
          className="text-slate-300"
        />

      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

function AttendanceMetric({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-800">
        {value}
      </span>

    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>

      </div>

      <ChevronRight
        size={17}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500"
      />

    </button>
  );
}

function SparklesIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center">
      <span className="relative text-indigo-500">
        ✦
      </span>
    </span>
  );
}

export default StudentDashboard;