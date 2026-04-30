-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "cw_code" VARCHAR(50),
    "is_shipper" BOOLEAN NOT NULL DEFAULT false,
    "is_consignee" BOOLEAN NOT NULL DEFAULT false,
    "is_agent" BOOLEAN NOT NULL DEFAULT false,
    "origin" VARCHAR(10),
    "address1" VARCHAR(255),
    "address2" VARCHAR(255),
    "address3" VARCHAR(255),
    "address4" VARCHAR(255),
    "city" VARCHAR(100),
    "postal" VARCHAR(20),
    "country" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_relationships" (
    "id" UUID NOT NULL,
    "org_id_a" UUID NOT NULL,
    "org_id_b" UUID NOT NULL,
    "label" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users"
    ADD COLUMN "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "name" VARCHAR(100) NOT NULL DEFAULT 'Unknown User',
    ADD COLUMN "organization_id" UUID,
    ADD COLUMN "phone" VARCHAR(50);

-- AlterTable
ALTER TABLE "users"
    ALTER COLUMN "email" TYPE VARCHAR(255),
    ALTER COLUMN "password_hash" TYPE VARCHAR(255),
    ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC',
    ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(6) USING "updated_at" AT TIME ZONE 'UTC',
    DROP COLUMN "role";

-- AlterTable
ALTER TABLE "users"
    ALTER COLUMN "name" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_relationships_org_id_a_org_id_b_key" ON "organization_relationships"("org_id_a", "org_id_b");

-- CreateIndex
CREATE INDEX "organization_relationships_org_id_a_idx" ON "organization_relationships"("org_id_a");

-- CreateIndex
CREATE INDEX "organization_relationships_org_id_b_idx" ON "organization_relationships"("org_id_b");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddConstraint
ALTER TABLE "organization_relationships"
    ADD CONSTRAINT "organization_relationships_org_id_a_org_id_b_distinct"
    CHECK ("org_id_a" <> "org_id_b");

-- AddForeignKey
ALTER TABLE "organization_relationships"
    ADD CONSTRAINT "organization_relationships_org_id_a_fkey"
    FOREIGN KEY ("org_id_a") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_relationships"
    ADD CONSTRAINT "organization_relationships_org_id_b_fkey"
    FOREIGN KEY ("org_id_b") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users"
    ADD CONSTRAINT "users_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
