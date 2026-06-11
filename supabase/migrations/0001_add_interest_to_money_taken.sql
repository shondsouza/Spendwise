
ALTER TABLE "public"."money_taken"
ADD COLUMN "has_interest" boolean DEFAULT false,
ADD COLUMN "simple_interest_rate" numeric,
ADD COLUMN "simple_interest_years" integer,
ADD COLUMN "compound_interest_rate" numeric,
ADD COLUMN "compounding_frequency" integer,
ADD COLUMN "total_tenure_years" integer;
