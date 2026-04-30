-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipMode" AS ENUM ('AIR', 'SEA');

-- CreateEnum
CREATE TYPE "BookingPartyRole" AS ENUM ('SHIPPER', 'CONSIGNEE', 'NOTIFY_1', 'NOTIFY_2');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('PREPAID', 'COLLECT');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('CFR', 'CIF', 'CIP', 'TBD');

-- CreateEnum
CREATE TYPE "SeaServiceRequire" AS ENUM ('CFS/CFS', 'CY/CY', 'CFS/CY', 'CY/CFS');

-- CreateEnum
CREATE TYPE "SeaOptionalService" AS ENUM ('PICKUP', 'HAULAGE', 'REPACK', 'DECLARATION', 'INSURANCE');

-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('FCL', 'LCL');

-- CreateEnum
CREATE TYPE "PortMode" AS ENUM ('AIR', 'SEA', 'BOTH');

-- CreateEnum
CREATE TYPE "BillOfLadingRequirement" AS ENUM ('SHIPPED_ON_BOARD', 'RECEIVED_FOR_SHIPMENT');

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "company_code" VARCHAR(10) NOT NULL,
    "e_booking_number" VARCHAR(30),
    "hawb_number" VARCHAR(50),
    "ship_mode" "ShipMode" NOT NULL,
    "reference_number" VARCHAR(100),
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_parties" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "role" "BookingPartyRole" NOT NULL,
    "party_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "address1" VARCHAR(255),
    "address2" VARCHAR(255),
    "address3" VARCHAR(255),
    "address4" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_shipment_details" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "origin_port_id" UUID,
    "destination_port_id" UUID,
    "final_destination_port_id" UUID,
    "gross_weight" DECIMAL(10,2),
    "cbm" DECIMAL(10,3),
    "volume_weight" DECIMAL(10,2),
    "chargeable_weight" DECIMAL(10,2),
    "number_of_package" INTEGER,
    "cargo_ready_date" DATE,
    "etd" DATE,
    "eta" DATE,
    "freight_charges" "ChargeType",
    "other_charges" "ChargeType",
    "incoterm" "Incoterm",
    "sample_shipment" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_shipment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_sea_details" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "export_license_no" VARCHAR(100),
    "service_require" "SeaServiceRequire",
    "optional_services" "SeaOptionalService"[],
    "bill_of_lading_requirement" "BillOfLadingRequirement",
    "number_of_original_bl" INTEGER,
    "shipment_type" "ShipmentType",
    "container_gp20" INTEGER NOT NULL DEFAULT 0,
    "container_gp40" INTEGER NOT NULL DEFAULT 0,
    "container_hq40" INTEGER NOT NULL DEFAULT 0,
    "container_gp45" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_sea_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_marks" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "description_of_goods" TEXT,
    "marks_nos" TEXT,
    "contains_batteries" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_po_details" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "po_number" VARCHAR(100) NOT NULL,
    "style_number" VARCHAR(100),
    "item_number" VARCHAR(100),
    "goods_description" VARCHAR(255),
    "ctns" INTEGER,
    "pieces" INTEGER,
    "gross_weight" DECIMAL(10,2),
    "cbm" DECIMAL(10,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_po_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address1" VARCHAR(255),
    "address2" VARCHAR(255),
    "address3" VARCHAR(255),
    "address4" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_info" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    "mode" "PortMode" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "port_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_sequences" (
    "id" UUID NOT NULL,
    "company_code" VARCHAR(10) NOT NULL,
    "date" DATE NOT NULL,
    "last_sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "booking_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_e_booking_number_key" ON "bookings"("e_booking_number");

-- CreateIndex
CREATE INDEX "bookings_created_by_idx" ON "bookings"("created_by");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "booking_parties_booking_id_idx" ON "booking_parties"("booking_id");

-- CreateIndex
CREATE INDEX "booking_parties_party_id_idx" ON "booking_parties"("party_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_parties_booking_id_role_key" ON "booking_parties"("booking_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "booking_shipment_details_booking_id_key" ON "booking_shipment_details"("booking_id");

-- CreateIndex
CREATE INDEX "booking_shipment_details_origin_port_id_idx" ON "booking_shipment_details"("origin_port_id");

-- CreateIndex
CREATE INDEX "booking_shipment_details_destination_port_id_idx" ON "booking_shipment_details"("destination_port_id");

-- CreateIndex
CREATE INDEX "booking_shipment_details_final_destination_port_id_idx" ON "booking_shipment_details"("final_destination_port_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_sea_details_booking_id_key" ON "booking_sea_details"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_marks_booking_id_key" ON "booking_marks"("booking_id");

-- CreateIndex
CREATE INDEX "booking_po_details_booking_id_idx" ON "booking_po_details"("booking_id");

-- CreateIndex
CREATE INDEX "parties_name_idx" ON "parties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "port_info_code_key" ON "port_info"("code");

-- CreateIndex
CREATE INDEX "port_info_name_idx" ON "port_info"("name");

-- CreateIndex
CREATE INDEX "port_info_mode_idx" ON "port_info"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "booking_sequences_company_code_date_key" ON "booking_sequences"("company_code", "date");

-- AddConstraint
ALTER TABLE "booking_po_details"
    ADD CONSTRAINT "booking_po_details_ctns_non_negative"
    CHECK ("ctns" IS NULL OR "ctns" >= 0);

-- AddConstraint
ALTER TABLE "booking_po_details"
    ADD CONSTRAINT "booking_po_details_pieces_non_negative"
    CHECK ("pieces" IS NULL OR "pieces" >= 0);

-- AddConstraint
ALTER TABLE "booking_po_details"
    ADD CONSTRAINT "booking_po_details_gross_weight_non_negative"
    CHECK ("gross_weight" IS NULL OR "gross_weight" >= 0);

-- AddConstraint
ALTER TABLE "booking_po_details"
    ADD CONSTRAINT "booking_po_details_cbm_non_negative"
    CHECK ("cbm" IS NULL OR "cbm" >= 0);

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_parties" ADD CONSTRAINT "booking_parties_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_parties" ADD CONSTRAINT "booking_parties_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_shipment_details" ADD CONSTRAINT "booking_shipment_details_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_shipment_details" ADD CONSTRAINT "booking_shipment_details_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "port_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_shipment_details" ADD CONSTRAINT "booking_shipment_details_final_destination_port_id_fkey" FOREIGN KEY ("final_destination_port_id") REFERENCES "port_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_shipment_details" ADD CONSTRAINT "booking_shipment_details_origin_port_id_fkey" FOREIGN KEY ("origin_port_id") REFERENCES "port_info"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_sea_details" ADD CONSTRAINT "booking_sea_details_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_marks" ADD CONSTRAINT "booking_marks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_po_details" ADD CONSTRAINT "booking_po_details_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
