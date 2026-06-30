export const AUDIT_ENTITY_TYPES = [
    "user",
    "school_subscription",
    "school_profile",
    "canteen",
    "menu_item",
    "order",
    "student",
] as const;

export const AUDIT_ACTIONS = [
    "user_blocked",
    "user_reactivated",
    "session_reverification_triggered",
    "student_limit_adjusted",
    "subscription_tier_overridden",
    "role_updated",
    "canteen_staff_assigned",
    "canteen_staff_unassigned",
    "order_cancelled",
    "profile_updated",
] as const;

export const ACTION_COLOURS: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    user_blocked: {
        bg: "rgba(239,68,68,0.1)",
        color: "#ef4444",
        border: "rgba(239,68,68,0.2)",
        dot: "#ef4444",
    },
    user_reactivated: {
        bg: "rgba(34,197,94,0.1)",
        color: "#22c55e",
        border: "rgba(34,197,94,0.2)",
        dot: "#22c55e",
    },
    subscription_tier_overridden: {
        bg: "rgba(168,85,247,0.1)",
        color: "#a855f7",
        border: "rgba(168,85,247,0.2)",
        dot: "#a855f7",
    },
    student_limit_adjusted: {
        bg: "rgba(59,130,246,0.1)",
        color: "#3b82f6",
        border: "rgba(59,130,246,0.2)",
        dot: "#3b82f6",
    },
    session_reverification_triggered: {
        bg: "rgba(245,158,11,0.1)",
        color: "#f59e0b",
        border: "rgba(245,158,11,0.2)",
        dot: "#f59e0b",
    },
};

export const DEFAULT_ACTION_COLOUR = {
    bg: "rgba(113,113,122,0.1)",
    color: "#71717a",
    border: "rgba(113,113,122,0.2)",
    dot: "#71717a",
};
