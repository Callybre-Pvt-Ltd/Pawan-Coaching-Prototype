import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "tutor", "student"]);
export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "inactive",
]);
export const batchStatusEnum = pgEnum("batch_status", ["active", "archived"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
]);
export const feeStatusEnum = pgEnum("fee_status", ["pending", "paid"]);
export const feeFrequencyEnum = pgEnum("fee_frequency", ["monthly", "custom"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "upi",
  "bank",
  "other",
]);
export const receiptStatusEnum = pgEnum("receipt_status", ["active", "void"]);
export const weekdayEnum = pgEnum("weekday", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull(),
    status: accountStatusEnum("status").notNull().default("active"),
    ...auditColumns,
  },
  (table) => [uniqueIndex("users_email_lower_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    csrfHash: varchar("csrf_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    rememberMe: boolean("remember_me").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const centerSettings = pgTable("center_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 180 })
    .notNull()
    .default("Pawan Sir Commerce & English Classes"),
  phone: varchar("phone", { length: 16 }),
  address: text("address"),
  setupComplete: boolean("setup_complete").notNull().default(false),
  ...auditColumns,
});

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id),
    studentCode: varchar("student_code", { length: 24 }).notNull().unique(),
    name: varchar("name", { length: 140 }).notNull(),
    dob: date("dob", { mode: "string" }).notNull(),
    contactPhone: varchar("contact_phone", { length: 16 }),
    guardianName: varchar("guardian_name", { length: 140 }).notNull(),
    guardianContact: varchar("guardian_contact", { length: 16 }).notNull(),
    ...auditColumns,
  },
  (table) => [
    index("students_name_idx").on(table.name),
    index("students_code_idx").on(table.studentCode),
  ],
);

export const tutors = pgTable(
  "tutors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id),
    tutorCode: varchar("tutor_code", { length: 24 }).notNull().unique(),
    name: varchar("name", { length: 140 }).notNull(),
    dob: date("dob", { mode: "string" }).notNull(),
    contactPhone: varchar("contact_phone", { length: 16 }).notNull(),
    ...auditColumns,
  },
  (table) => [
    index("tutors_name_idx").on(table.name),
    index("tutors_code_idx").on(table.tutorCode),
  ],
);

export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    subject: varchar("subject", { length: 120 }).notNull(),
    status: batchStatusEnum("status").notNull().default("active"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    capacity: integer("capacity"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...auditColumns,
  },
  (table) => [
    index("batches_name_idx").on(table.name),
    index("batches_status_idx").on(table.status),
  ],
);

export const batchScheduleSlots = pgTable(
  "batch_schedule_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    weekday: weekdayEnum("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    ...auditColumns,
  },
  (table) => [index("schedule_slots_batch_idx").on(table.batchId)],
);

export const scheduleSlotTutors = pgTable(
  "schedule_slot_tutors",
  {
    slotId: uuid("slot_id")
      .notNull()
      .references(() => batchScheduleSlots.id, { onDelete: "cascade" }),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => tutors.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.slotId, table.tutorId] }),
    index("slot_tutors_tutor_idx").on(table.tutorId),
  ],
);

export const batchEnrollments = pgTable(
  "batch_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    joinedOn: date("joined_on", { mode: "string" }).notNull(),
    leftOn: date("left_on", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("enrollments_batch_idx").on(table.batchId),
    index("enrollments_student_idx").on(table.studentId),
  ],
);

export const scheduleCancellations = pgTable(
  "schedule_cancellations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => batchScheduleSlots.id),
    sessionDate: date("session_date", { mode: "string" }).notNull(),
    reason: varchar("reason", { length: 240 }).notNull(),
    cancelledBy: uuid("cancelled_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("schedule_cancellation_unique").on(
      table.slotId,
      table.sessionDate,
    ),
  ],
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id),
    slotId: uuid("slot_id").references(() => batchScheduleSlots.id),
    sessionDate: date("session_date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    extraReason: varchar("extra_reason", { length: 240 }),
    markedBy: uuid("marked_by")
      .notNull()
      .references(() => users.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("attendance_session_unique").on(
      table.batchId,
      table.sessionDate,
      table.startTime,
      table.endTime,
    ),
    index("attendance_session_batch_date_idx").on(
      table.batchId,
      table.sessionDate,
    ),
  ],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    status: attendanceStatusEnum("status").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.studentId] }),
    index("attendance_student_idx").on(table.studentId),
  ],
);

export const feePlans = pgTable(
  "fee_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    amountPaise: integer("amount_paise").notNull(),
    frequency: feeFrequencyEnum("frequency").notNull(),
    monthlyDueDay: integer("monthly_due_day"),
    customDates: jsonb("custom_dates").$type<string[]>(),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveTo: date("effective_to", { mode: "string" }),
    ...auditColumns,
  },
  (table) => [index("fee_plans_student_idx").on(table.studentId)],
);

export const feeDues = pgTable(
  "fee_dues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    feePlanId: uuid("fee_plan_id").references(() => feePlans.id),
    description: varchar("description", { length: 180 }).notNull(),
    amountPaise: integer("amount_paise").notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: feeStatusEnum("status").notNull().default("pending"),
    ...auditColumns,
  },
  (table) => [
    index("fee_dues_student_idx").on(table.studentId),
    index("fee_dues_status_date_idx").on(table.status, table.dueDate),
  ],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  feeDueId: uuid("fee_due_id")
    .notNull()
    .unique()
    .references(() => feeDues.id),
  paidOn: date("paid_on", { mode: "string" }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  otherMethod: varchar("other_method", { length: 80 }),
  reference: varchar("reference", { length: 180 }),
  payerName: varchar("payer_name", { length: 140 }),
  recordedBy: uuid("recorded_by")
    .notNull()
    .references(() => users.id),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  reversedBy: uuid("reversed_by").references(() => users.id),
  ...auditColumns,
});

export const receipts = pgTable(
  "receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .unique()
      .references(() => payments.id),
    receiptNumber: varchar("receipt_number", { length: 24 }).notNull().unique(),
    sequenceYear: integer("sequence_year").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    status: receiptStatusEnum("status").notNull().default("active"),
    amountPaise: integer("amount_paise").notNull(),
    studentName: varchar("student_name", { length: 140 }).notNull(),
    studentCode: varchar("student_code", { length: 24 }).notNull(),
    description: varchar("description", { length: 180 }).notNull(),
    paidOn: date("paid_on", { mode: "string" }).notNull(),
    paymentMethod: varchar("payment_method", { length: 80 }).notNull(),
    payerName: varchar("payer_name", { length: 140 }),
    reference: varchar("reference", { length: 180 }),
    centerSnapshot: jsonb("center_snapshot")
      .$type<{ name: string; phone: string | null; address: string | null }>()
      .notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("receipt_year_sequence_unique").on(
      table.sequenceYear,
      table.sequenceNumber,
    ),
  ],
);

export const idCards = pgTable("id_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  expiryDate: date("expiry_date", { mode: "string" }).notNull(),
  ...auditColumns,
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_entity_idx").on(table.entityType, table.entityId),
    index("audit_actor_idx").on(table.actorUserId),
  ],
);

export type UserRole = (typeof roleEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Tutor = typeof tutors.$inferSelect;
