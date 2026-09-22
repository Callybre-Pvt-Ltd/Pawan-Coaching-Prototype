export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Pawan Coaching Management API",
    version: "0.1.0",
    description:
      "Cookie-authenticated REST contract for the coaching management prototype.",
  },
  servers: [{ url: "/", description: "Current deployment" }],
  tags: [
    { name: "Authentication" },
    { name: "Center" },
    { name: "People" },
    { name: "Batches" },
    { name: "Attendance" },
    { name: "Fees" },
    { name: "System" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Service health",
        responses: { "200": { description: "Service is available" } },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Create a session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Session created" },
          "401": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Revoke the current session",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "204": { description: "Session revoked" },
          "403": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/center-settings": {
      get: {
        tags: ["Center"],
        summary: "Read center identity",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Center settings" },
          "401": { $ref: "#/components/responses/Problem" },
        },
      },
      put: {
        tags: ["Center"],
        summary: "Complete or update center settings",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "200": { description: "Updated settings" },
          "403": { $ref: "#/components/responses/Problem" },
          "422": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/students": {
      get: {
        tags: ["People"],
        summary: "List students",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            in: "query",
            name: "cursor",
            schema: { type: "string" },
          },
        ],
        responses: { "200": { description: "Cursor page of students" } },
      },
      post: {
        tags: ["People"],
        summary: "Create a student account and profile",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "201": { description: "Student created" },
          "422": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/tutors": {
      get: {
        tags: ["People"],
        summary: "List tutors",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "Cursor page of tutors" } },
      },
      post: {
        tags: ["People"],
        summary: "Create a tutor account and profile",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "201": { description: "Tutor created" },
          "422": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/batches": {
      get: {
        tags: ["Batches"],
        summary: "List visible batches",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "Batch page" } },
      },
      post: {
        tags: ["Batches"],
        summary: "Create a batch with weekly schedule slots",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "201": { description: "Batch created with conflict warnings" },
          "422": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/batches/{id}/archive": {
      post: {
        tags: ["Batches"],
        summary: "Archive a batch on a chosen date",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "204": { description: "Batch archived" } },
      },
    },
    "/api/batches/{id}/unarchive": {
      post: {
        tags: ["Batches"],
        summary: "Unarchive only the batch record",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": {
            description: "Batch unarchived; relationships remain ended",
          },
        },
      },
    },
    "/api/attendance-sessions": {
      get: {
        tags: ["Attendance"],
        summary: "List role-scoped submitted sessions",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "Attendance sessions" } },
      },
      post: {
        tags: ["Attendance"],
        summary: "Submit held-session attendance for a complete dated roster",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "201": { description: "Attendance submitted" },
          "409": { $ref: "#/components/responses/Problem" },
          "422": { $ref: "#/components/responses/Problem" },
        },
      },
    },
    "/api/schedule-cancellations": {
      post: {
        tags: ["Attendance"],
        summary: "Cancel a scheduled occurrence with a reason",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: { "201": { description: "Occurrence cancelled" } },
      },
    },
    "/api/fee-plans": {
      get: {
        tags: ["Fees"],
        summary: "Read fee-plan history",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "Fee plans" } },
      },
      post: {
        tags: ["Fees"],
        summary: "Create an effective-dated fee-plan version",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: { "201": { description: "Fee plan created" } },
      },
    },
    "/api/fee-dues": {
      get: {
        tags: ["Fees"],
        summary: "List role-scoped manual dues",
        security: [{ sessionCookie: [] }],
        responses: { "200": { description: "Fee dues" } },
      },
      post: {
        tags: ["Fees"],
        summary: "Create a manual fee due",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "201": { description: "Fee due created with duplicate warnings" },
        },
      },
    },
    "/api/fee-dues/{id}/payment": {
      post: {
        tags: ["Fees"],
        summary: "Record or update a full payment and receipt",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "200": { description: "Payment and receipt snapshot" } },
      },
    },
    "/api/fee-dues/{id}/reversal": {
      post: {
        tags: ["Fees"],
        summary: "Reverse payment and void its receipt",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "204": { description: "Payment reversed" } },
      },
    },
    "/api/users/{id}/deactivation": {
      post: {
        tags: ["People"],
        summary: "Deactivate an account and end active relationships",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "204": { description: "Account deactivated" } },
      },
      delete: {
        tags: ["People"],
        summary: "Reactivate an account without restoring relationships",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "204": { description: "Account reactivated" } },
      },
    },
    "/api/account/password": {
      post: {
        tags: ["Authentication"],
        summary: "Change the current user's password",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "204": { description: "Password changed; other sessions revoked" },
        },
      },
    },
    "/api/users/{id}/password-reset": {
      post: {
        tags: ["Authentication"],
        summary: "Admin reset of a Tutor or Student password",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Password reset; all sessions revoked" },
        },
      },
    },
    "/api/batches/{id}/enrollments": {
      post: {
        tags: ["Batches"],
        summary: "Create a dated batch enrollment",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "201": {
            description:
              "Enrollment created with capacity and timetable warnings",
          },
        },
      },
    },
    "/api/enrollments/{id}/leave": {
      post: {
        tags: ["Batches"],
        summary: "End an enrollment on a chosen date",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: { "204": { description: "Enrollment ended" } },
      },
    },
    "/api/attendance-sessions/{id}": {
      patch: {
        tags: ["Attendance"],
        summary: "Correct all statuses in a submitted session",
        security: [{ sessionCookie: [], csrfToken: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Attendance corrected with an audit event" },
        },
      },
    },
    "/api/attendance-reports": {
      get: {
        tags: ["Attendance"],
        summary: "Calculate role-scoped attendance metrics, trend, and detail",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            in: "query",
            name: "studentId",
            schema: { type: "string", format: "uuid" },
          },
          {
            in: "query",
            name: "from",
            required: true,
            schema: { type: "string", format: "date" },
          },
          {
            in: "query",
            name: "to",
            required: true,
            schema: { type: "string", format: "date" },
          },
        ],
        responses: { "200": { description: "Attendance report" } },
      },
    },
    "/api/id-cards": {
      post: {
        tags: ["People"],
        summary: "Issue or renew a Student or Tutor ID card",
        security: [{ sessionCookie: [], csrfToken: [] }],
        responses: {
          "200": { description: "Card renewed" },
          "201": { description: "Card issued" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "psc_session",
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "x-csrf-token",
      },
    },
    responses: {
      Problem: {
        description: "RFC 9457 Problem Details",
        content: {
          "application/problem+json": {
            schema: { $ref: "#/components/schemas/Problem" },
          },
        },
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          rememberMe: { type: "boolean", default: false },
        },
      },
      Problem: {
        type: "object",
        required: ["type", "title", "status"],
        properties: {
          type: { type: "string", format: "uri-reference" },
          title: { type: "string" },
          status: { type: "integer", minimum: 400, maximum: 599 },
          detail: { type: "string" },
          instance: { type: "string" },
          errors: { type: "object", additionalProperties: true },
        },
      },
    },
  },
} as const;
