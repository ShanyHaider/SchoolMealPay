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