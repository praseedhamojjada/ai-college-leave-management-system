import { useCallback, useEffect, useState } from "react";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import ApplyLeave from "./pages/ApplyLeave";
import FacultyDashboard from "./pages/FacultyDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import api from "./api/api";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("campusleave_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("campusleave_user");
      return null;
    }
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setActivePage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("campusleave_token");
    localStorage.removeItem("campusleave_user");
    setDashboardData(null);
    setDashboardError("");
    setActivePage("dashboard");
    setUser(null);
  };

  const loadStudentDashboard = useCallback(async () => {
    if (!user || user.role !== "STUDENT") return;

    setLoadingDashboard(true);
    setDashboardError("");

    try {
      const response = await api.get("/dashboard/student");
      setDashboardData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
        return;
      }

      setDashboardError(
        error.response?.data?.detail ||
          "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      loadStudentDashboard();
    }
  }, [user, loadStudentDashboard]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === "STUDENT") {
    if (activePage === "apply-leave") {
      return (
        <ApplyLeave
          user={user}
          dashboardData={dashboardData}
          onBack={() => setActivePage("dashboard")}
          onSuccess={async () => {
            await loadStudentDashboard();
            setActivePage("dashboard");
          }}
        />
      );
    }

    return (
      <StudentDashboard
        user={user}
        dashboardData={dashboardData}
        loading={loadingDashboard}
        onRefresh={loadStudentDashboard}
        onLogout={handleLogout}
        onApplyLeave={() => setActivePage("apply-leave")}
      />
    );
  }

  if (user.role === "FACULTY") {
    return (
      <FacultyDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  if (user.role === "HOD" || user.role === "ADMIN") {
    return (
      <ManagementDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard unavailable
        </h1>

        <p className="mt-3 text-slate-500">
          Your account role is not configured for a dashboard yet.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-xl bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;
