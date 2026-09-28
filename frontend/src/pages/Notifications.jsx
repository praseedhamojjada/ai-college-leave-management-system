import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Info,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/api";

function Notifications({ user, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications || []);
      setUnreadCount(Number(response.data?.unread_count || 0));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") {
      return notifications.filter((notification) => !notification.is_read);
    }

    return notifications;
  }, [filter, notifications]);

  const markAsRead = async (notificationId) => {
    setMarkingId(notificationId);
    setActionError("");

    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          "Unable to update this notification."
      );
    } finally {
      setMarkingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAll(true);
    setActionError("");

    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationConfig = (type) => {
    switch (type) {
      case "LEAVE_APPROVED":
        return {
          icon: CheckCircle2,
          iconClass: "bg-emerald-50 text-emerald-600",
          badgeClass: "bg-emerald-50 text-emerald-700",
          label: "Approved",
        };

      case "LEAVE_REJECTED":
        return {
          icon: XCircle,
          iconClass: "bg-red-50 text-red-600",
          badgeClass: "bg-red-50 text-red-700",
          label: "Rejected",
        };

      case "LEAVE_SUBMITTED":
        return {
          icon: Bell,
          iconClass: "bg-indigo-50 text-indigo-600",
          badgeClass: "bg-indigo-50 text-indigo-700",
          label: "Leave update",
        };

      case "ATTENDANCE_ALERT":
        return {
          icon: ShieldAlert,
          iconClass: "bg-amber-50 text-amber-600",
          badgeClass: "bg-amber-50 text-amber-700",
          label: "Attendance",
        };

      default:
        return {
          icon: Info,
          iconClass: "bg-slate-100 text-slate-600",
          badgeClass: "bg-slate-100 text-slate-600",
          label: "Information",
        };
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "Just now";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadVisibleCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
              title="Back to dashboard"
            >
              <ChevronLeft size={19} />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Student Portal
              </p>
              <h1 className="text-lg font-bold text-slate-900">
                Notifications
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={refreshing || loading}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] p-5 md:p-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Bell size={23} className="text-indigo-200" />
              </div>

              <p className="text-sm font-medium text-indigo-200">
                CampusLeave AI
              </p>

              <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                Stay updated on your campus activity
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/70">
                Leave decisions and important account updates will appear
                here.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-xs text-indigo-100/60">Unread</p>
              <p className="mt-1 text-3xl font-bold">{unreadCount}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <FilterButton
              active={filter === "ALL"}
              onClick={() => setFilter("ALL")}
            >
              All
              <span>{notifications.length}</span>
            </FilterButton>

            <FilterButton
              active={filter === "UNREAD"}
              onClick={() => setFilter("UNREAD")}
            >
              Unread
              <span>{unreadVisibleCount}</span>
            </FilterButton>
          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 size={16} />
            {markingAll ? "Updating..." : "Mark all as read"}
          </button>
        </section>

        {actionError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={21} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">
              Notifications unavailable
            </h3>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadNotifications()}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <section className="mt-6 space-y-3">
            {filteredNotifications.map((notification) => {
              const config = getNotificationConfig(
                notification.notification_type
              );
              const Icon = config.icon;

              return (
                <article
                  key={notification.notification_id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                    notification.is_read
                      ? "border-slate-200"
                      : "border-indigo-100 bg-indigo-[0.02]"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">
                              {notification.title}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${config.badgeClass}`}
                            >
                              {config.label}
                            </span>

                            {!notification.is_read && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                New
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 size={13} />
                          {formatDateTime(notification.created_at)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {notification.leave_id && (
                          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                            Leave #{notification.leave_id}
                          </span>
                        )}

                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(notification.notification_id)
                            }
                            disabled={markingId === notification.notification_id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            {markingId === notification.notification_id
                              ? "Updating..."
                              : "Mark as read"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="pb-6 pt-8 text-center text-xs text-slate-400">
          CampusLeave AI • Notifications are tied to your account and leave
          activity.
        </footer>
      </main>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <section className="mt-6 space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </section>
  );
}

function EmptyState({ filter }) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Bell size={23} />
      </div>

      <h3 className="mt-5 font-bold text-slate-800">
        {filter === "UNREAD" ? "You're all caught up" : "No notifications yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {filter === "UNREAD"
          ? "There are no unread notifications for your account."
          : "Leave approvals, rejections and other important updates will appear here."}
      </p>
    </section>
  );
}

export default Notifications;
