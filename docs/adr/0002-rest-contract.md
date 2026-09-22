# ADR 0002: REST and generated contracts

The browser uses unversioned `/api` REST resources. Domain transitions use explicit action routes rather than unconstrained status patches. Valibot schemas are the validation source and the development OpenAPI document must be checked for drift in CI.
