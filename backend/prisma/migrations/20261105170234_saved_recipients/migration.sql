-- CreateTable
CREATE TABLE "saved_recipients" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "alias" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_recipients_owner_user_id_created_at_idx" ON "saved_recipients"("owner_user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "saved_recipients_owner_user_id_recipient_user_id_key" ON "saved_recipients"("owner_user_id", "recipient_user_id");

-- AddForeignKey
ALTER TABLE "saved_recipients" ADD CONSTRAINT "saved_recipients_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipients" ADD CONSTRAINT "saved_recipients_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business rule enforced by the database as a last line of defence: nobody saves themselves.
ALTER TABLE "saved_recipients" ADD CONSTRAINT "saved_recipients_not_self" CHECK ("owner_user_id" <> "recipient_user_id");
