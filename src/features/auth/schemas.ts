import * as v from "valibot";

export const loginSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(320)),
  password: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
  rememberMe: v.optional(v.boolean(), false),
});

export const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8),
  v.maxLength(128),
);
