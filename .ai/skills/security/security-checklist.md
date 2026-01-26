# Security Checklist

- [ ] **Authentication**: User is authenticated for private routes.
- [ ] **Authorization**: User owns the resource they are accessing.
- [ ] **Input Validation**: All inputs (query code, body, file) are validated (Zod).
- [ ] **File Security**:
  - [ ] Valid MIME type.
  - [ ] Valid extension.
  - [ ] Size limit enforced.
  - [ ] Filename sanitized (no path traversal).
- [ ] **Secrets**: No hardcoded API keys/passwords. Use `.env`.
- [ ] **Encryption**: HTTPS only. Storage encryption if sensitive.
- [ ] **Dependencies**: No known vulnerabilities (`npm audit`).
- [ ] **Logs**: No sensitive info in logs.
