CREATE TYPE "public"."role" AS ENUM('system_admin', 'school_admin', 'canteen_staff', 'parent');--> statement-breakpoint
CREATE TYPE "public"."allergen" AS ENUM('nuts', 'gluten', 'dairy', 'eggs', 'soy', 'shellfish', 'fish', 'sesame');--> statement-breakpoint
CREATE TYPE "public"."link_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."meal_category" AS ENUM('breakfast', 'lunch', 'snack', 'beverage');--> statement-breakpoint
CREATE TYPE "public"."meal_slot" AS ENUM('breakfast', 'lunch', 'snack');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'preparing', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."inventory_change_reason" AS ENUM('order_fulfilled', 'manual_add', 'manual_remove', 'waste', 'expired');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'jazzcash', 'easypaisa', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'success', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('wallet_topup', 'purchase', 'refund');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'cancelled', 'expired', 'unpaid', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium_school', 'parent_pro');--> statement-breakpoint
CREATE TYPE "public"."trend_level" AS ENUM('on_track', 'low', 'high');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('meal', 'system', 'feature_request', 'bug_report');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email', 'sms', 'push');--> statement-breakpoint
CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."school_type" AS ENUM('primary', 'secondary', 'both');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('unread', 'read', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."demo_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"name" varchar NOT NULL,
	"phone" varchar,
	"image_url" varchar,
	"role" "role" DEFAULT 'parent' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"dietary_preferences" text,
	"medical_notes" text,
	"daily_spending_limit" numeric(10, 2),
	"weekly_spending_limit" numeric(10, 2),
	"approval_threshold" numeric(10, 2),
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_profiles_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade" varchar NOT NULL,
	"section" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_child_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "link_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_child_links_parent_id_student_id_unique" UNIQUE("parent_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "student_allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"allergen" "allergen" NOT NULL,
	CONSTRAINT "student_allergens_student_id_allergen_unique" UNIQUE("student_id","allergen")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"student_code" varchar NOT NULL,
	"class_id" uuid,
	"image_url" varchar,
	"ordering_enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_student_code_unique" UNIQUE("student_code")
);
--> statement-breakpoint
CREATE TABLE "canteen_staff_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"canteen_id" uuid NOT NULL,
	"assigned_by" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "canteen_staff_assignments_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
CREATE TABLE "canteens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"location" varchar,
	"operating_from" time,
	"operating_until" time,
	"capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canteen_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"menu_date" date NOT NULL,
	"meal_slot" "meal_slot" NOT NULL,
	"available_from" time,
	"available_until" time,
	CONSTRAINT "daily_menus_canteen_id_menu_item_id_menu_date_meal_slot_unique" UNIQUE("canteen_id","menu_item_id","menu_date","meal_slot")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canteen_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"quantity" numeric(10, 3) DEFAULT '0' NOT NULL,
	"unit" varchar NOT NULL,
	"low_stock_threshold" numeric(10, 3),
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canteen_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"category" "meal_category" NOT NULL,
	"calories" integer,
	"protein_g" numeric(6, 2),
	"fiber_g" numeric(6, 2),
	"carbs_g" numeric(6, 2),
	"fat_g" numeric(6, 2),
	"is_vegetarian" boolean DEFAULT false NOT NULL,
	"is_vegan" boolean DEFAULT false NOT NULL,
	"contains_nuts" boolean DEFAULT false NOT NULL,
	"contains_gluten" boolean DEFAULT false NOT NULL,
	"contains_dairy" boolean DEFAULT false NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_special_of_day" boolean DEFAULT false NOT NULL,
	"image_url" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"parent_id" uuid,
	"canteen_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"qr_code" varchar,
	"qr_used" boolean DEFAULT false NOT NULL,
	"qr_invalidated_at" timestamp with time zone,
	"preparation_deadline_at" timestamp with time zone,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_group_id" uuid,
	"order_date" date NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"collected_at" timestamp with time zone,
	CONSTRAINT "orders_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "inventory_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canteen_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"order_id" uuid,
	"performed_by" uuid,
	"reason" "inventory_change_reason" NOT NULL,
	"quantity_before" numeric(10, 3) NOT NULL,
	"quantity_changed" numeric(10, 3) NOT NULL,
	"quantity_after" numeric(10, 3) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spending_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"order_amount" numeric(10, 2) NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"rejection_reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spending_approvals_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "parent_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_wallets_parent_id_unique" UNIQUE("parent_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"parent_id" uuid,
	"transaction_ref" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"transaction_type" "transaction_type" DEFAULT 'purchase' NOT NULL,
	"failure_reason" varchar,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_transaction_ref_unique" UNIQUE("transaction_ref")
);
--> statement-breakpoint
CREATE TABLE "parent_pro_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"trial_started_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"trial_used" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"gateway_subscription_id" varchar,
	"cancelled_at" timestamp with time zone,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parent_pro_subscriptions_parent_id_unique" UNIQUE("parent_id"),
	CONSTRAINT "parent_pro_subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "parent_pro_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "school_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'trialing' NOT NULL,
	"billing_cycle" "billing_cycle",
	"trial_started_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"trial_used" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"student_limit" integer DEFAULT 50 NOT NULL,
	"gateway_subscription_id" varchar,
	"gateway_customer_id" varchar,
	"cancelled_at" timestamp with time zone,
	"revert_to_free_at" timestamp with time zone,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_subscription_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "school_subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"billing_cycle" "billing_cycle",
	"stripe_invoice_id" varchar,
	"currency" varchar(3) DEFAULT 'PKR' NOT NULL,
	"billing_period_start" timestamp with time zone,
	"billing_period_end" timestamp with time zone,
	"gateway_invoice_id" varchar,
	"paid_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"hosted_invoice_url" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "ai_meal_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"reason" text,
	"for_date" date NOT NULL,
	"was_selected" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"nutrient" text NOT NULL,
	"average_daily" numeric(6, 2) NOT NULL,
	"target_daily" numeric(6, 2) NOT NULL,
	"percent_of_target" numeric(5, 1) NOT NULL,
	"trend_level" "trend_level" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"display_note" text,
	"parent_viewed_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar NOT NULL,
	"age_group_min" integer,
	"age_group_max" integer,
	"daily_calories" integer,
	"daily_protein_g" numeric(6, 2),
	"daily_fiber_g" numeric(6, 2),
	"daily_carbs_g" numeric(6, 2),
	"daily_fat_g" numeric(6, 2),
	"source" varchar,
	"is_default" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"user_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"admin_response" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"channel" "notification_channel" DEFAULT 'in_app' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "feedback_type" NOT NULL,
	"rating" integer,
	"message" text NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"body" text NOT NULL,
	"channels" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_event_type_unique" UNIQUE("event_type")
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canteen_id" uuid,
	"key" varchar NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_config_key_unique" UNIQUE("key"),
	CONSTRAINT "canteen_config_key_unique" UNIQUE("canteen_id","key")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbot_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_context" jsonb,
	"topic" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbot_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"phone" varchar(50),
	"clerk_invitation_id" varchar(255),
	"role" varchar(50) DEFAULT 'canteen_staff' NOT NULL,
	"canteen_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_invitations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "school_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"address" text,
	"city" varchar,
	"phone" varchar,
	"email" varchar,
	"logo_url" varchar,
	"banner_url" varchar,
	"website" varchar,
	"primary_color" varchar DEFAULT '#000000',
	"timezone" varchar DEFAULT 'Asia/Karachi' NOT NULL,
	"academic_year" varchar,
	"school_type" "school_type",
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" varchar,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" text NOT NULL,
	"message" text NOT NULL,
	"status" "contact_status" DEFAULT 'unread' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"converted_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "demo_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"school" text NOT NULL,
	"role" text NOT NULL,
	"phone" text,
	"preferred_date" text,
	"preferred_slot" text NOT NULL,
	"status" "demo_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"converted_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"converted_user_id" uuid,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "processed_clerk_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_child_links" ADD CONSTRAINT "parent_child_links_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_allergens" ADD CONSTRAINT "student_allergens_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canteen_staff_assignments" ADD CONSTRAINT "canteen_staff_assignments_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canteen_staff_assignments" ADD CONSTRAINT "canteen_staff_assignments_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canteen_staff_assignments" ADD CONSTRAINT "canteen_staff_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_menus" ADD CONSTRAINT "daily_menus_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_menus" ADD CONSTRAINT "daily_menus_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_usage_logs" ADD CONSTRAINT "inventory_usage_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_items" ADD CONSTRAINT "blocked_items_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_items" ADD CONSTRAINT "blocked_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_items" ADD CONSTRAINT "blocked_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_approvals" ADD CONSTRAINT "spending_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_approvals" ADD CONSTRAINT "spending_approvals_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_approvals" ADD CONSTRAINT "spending_approvals_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_wallets" ADD CONSTRAINT "parent_wallets_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_pro_subscriptions" ADD CONSTRAINT "parent_pro_subscriptions_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_school_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."school_subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_meal_suggestions" ADD CONSTRAINT "ai_meal_suggestions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_meal_suggestions" ADD CONSTRAINT "ai_meal_suggestions_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_trends" ADD CONSTRAINT "nutrition_trends_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_feedback" ADD CONSTRAINT "meal_feedback_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_feedback" ADD CONSTRAINT "meal_feedback_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_feedback" ADD CONSTRAINT "meal_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_feedback" ADD CONSTRAINT "system_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_canteen_id_canteens_id_fk" FOREIGN KEY ("canteen_id") REFERENCES "public"."canteens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_messages" ADD CONSTRAINT "chatbot_messages_conversation_id_chatbot_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chatbot_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_converted_user_id_users_id_fk" FOREIGN KEY ("converted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_requests" ADD CONSTRAINT "demo_requests_converted_user_id_users_id_fk" FOREIGN KEY ("converted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_converted_user_id_users_id_fk" FOREIGN KEY ("converted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "parent_child_links_parent_idx" ON "parent_child_links" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "parent_child_links_student_idx" ON "parent_child_links" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_allergens_student_idx" ON "student_allergens" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "canteen_staff_assignments_canteen_idx" ON "canteen_staff_assignments" USING btree ("canteen_id");--> statement-breakpoint
CREATE INDEX "canteens_active_idx" ON "canteens" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "daily_menus_date_idx" ON "daily_menus" USING btree ("canteen_id","menu_date");--> statement-breakpoint
CREATE INDEX "orders_student_idx" ON "orders" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "orders_status_date_idx" ON "orders" USING btree ("status","order_date");--> statement-breakpoint
CREATE INDEX "orders_parent_date_idx" ON "orders" USING btree ("parent_id","order_date");--> statement-breakpoint
CREATE INDEX "orders_canteen_date_idx" ON "orders" USING btree ("canteen_id","order_date");--> statement-breakpoint
CREATE INDEX "inv_logs_canteen_item_idx" ON "inventory_usage_logs" USING btree ("canteen_id","inventory_item_id");--> statement-breakpoint
CREATE INDEX "inv_logs_reason_idx" ON "inventory_usage_logs" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "blocked_items_student_menu_item_idx" ON "blocked_items" USING btree ("student_id","menu_item_id");--> statement-breakpoint
CREATE INDEX "blocked_items_student_idx" ON "blocked_items" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "blocked_items_parent_idx" ON "blocked_items" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "spending_approvals_parent_status_idx" ON "spending_approvals" USING btree ("parent_id","status");--> statement-breakpoint
CREATE INDEX "spending_approvals_student_idx" ON "spending_approvals" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "parent_wallets_parent_idx" ON "parent_wallets" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "transactions_parent_idx" ON "transactions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ai_suggestions_student_date_idx" ON "ai_meal_suggestions" USING btree ("student_id","for_date");--> statement-breakpoint
CREATE INDEX "nutrition_trends_student_period_idx" ON "nutrition_trends" USING btree ("student_id","period_end");--> statement-breakpoint
CREATE INDEX "meal_feedback_student_idx" ON "meal_feedback" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "meal_feedback_order_idx" ON "meal_feedback" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_user_sent_idx" ON "notifications" USING btree ("user_id","createdAt");--> statement-breakpoint
CREATE INDEX "system_feedback_user_idx" ON "system_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_feedback_type_idx" ON "system_feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notification_templates_event_type_idx" ON "notification_templates" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "system_config_key_idx" ON "system_config" USING btree ("key");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "chatbot_conversations_user_idx" ON "chatbot_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chatbot_messages_conversation_time_idx" ON "chatbot_messages" USING btree ("conversation_id","createdAt");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");