CREATE TABLE "salesforce_connections" (
	"id" varchar(16) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"instance_url" varchar(255) NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"encrypted_access_token" text NOT NULL,
	"connected_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "salesforce_connections" ADD CONSTRAINT "salesforce_connections_connected_by_id_users_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;