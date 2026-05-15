"use client";

import { useState, useTransition } from "react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/db/actions/Notifications";
import {
  ShoppingBag,
  CreditCard,
  Bell,
  Salad,
  AlertTriangle,
  CheckCircle,
  Info,
  Check,
} from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: Date;
  channel: string;
};

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; iconColor: string }
> = {
  order_confirmed: {
    icon: ShoppingBag,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  order_ready: {
    icon: CheckCircle,
    bg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
  },
  payment_success: {
    icon: CreditCard,
    bg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
  },
  payment_failed: {
    icon: CreditCard,
    bg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
  meal_collected: {
    icon: CheckCircle,
    bg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
  },
  spending_limit: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  approval_required: {
    icon: AlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  nutrition_alert: {
    icon: Salad,
    bg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  low_balance: {
    icon: AlertTriangle,
    bg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
  system: {
    icon: Info,
    bg: "bg-gray-50 dark:bg-zinc-800",
    iconColor: "text-gray-500 dark:text-gray-400",
  },
};

function timeAgo(date: Date) {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function groupByDate(notifications: Notification[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, Notification[]> = {};

  for (const n of notifications) {
    const d = new Date(n.sentAt);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = "Today";
    else if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else
      key = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  return groups;
}

export function NotificationsClient({
  notifications,
  userId,
}: {
  notifications: Notification[];
  userId: string;
}) {
  const [items, setItems] = useState(notifications);
  const [isPending, startTransition] = useTransition();

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id, userId);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead(userId);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  }

  const unreadCount = items.filter((n) => !n.isRead).length;
  const groups = groupByDate(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <Bell size={24} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-bold text-black dark:text-white">All caught up</p>
          <p className="text-sm text-gray-500 mt-1">No notifications yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Mark all read */}
      {unreadCount > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
          >
            <Check size={12} />
            Mark all as read
          </button>
        </div>
      )}

      {/* Grouped notifications */}
      {Object.entries(groups).map(([date, groupItems]) => (
        <div key={date} className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 py-2">
            {date}
          </p>
          {groupItems.map((notification) => {
            const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  notification.isRead ?
                    "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 opacity-60"
                  : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 hover:border-black dark:hover:border-white"
                }`}
                onClick={() =>
                  !notification.isRead && handleMarkRead(notification.id)
                }
              >
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}
                >
                  <Icon size={18} className={config.iconColor} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-bold ${notification.isRead ? "text-gray-500 dark:text-gray-400" : "text-black dark:text-white"}`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {timeAgo(notification.sentAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-black dark:bg-white flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
