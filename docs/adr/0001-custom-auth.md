# ADR 0001: Custom database-backed authentication

Custom email/password authentication is used because accounts are created only by Admin or the provisioning CLI and no public identity provider is required. Passwords use Argon2id. Random session tokens are hashed before storage and expire after 24 hours of inactivity. This deliberately accepts the product decision not to throttle failed logins.
