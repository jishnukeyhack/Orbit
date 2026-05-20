# Threat Model: Simple E-commerce Product Catalog API

**Date**: 2024-07-30 | **Version**: 1.0 | **Author**: Security Engineer

## System Overview
- **Architecture**: Microservice (RESTful API)
- **Tech Stack**: Python, FastAPI, PostgreSQL, Docker
- **Data Classification**: Product details (name, description, price, images), potentially sensitive inventory data (stock levels, supplier info).
- **Deployment**: Kubernetes (EKS/GKE/AKS) with Docker containers.
- **External Integrations**: None directly from this API, but it's consumed by a separate E-commerce Frontend and potentially an Inventory Management System.

## Trust Boundaries
| Boundary | From | To | Controls |
|----------|------|----|----------|
| Internet → API Gateway | End user / Frontend | API Gateway | TLS, WAF, Rate Limiting |
| API Gateway → Product API | API Gateway | Product Catalog API | mTLS, JWT validation (for authenticated actions) |
| Product API → PostgreSQL | Product Catalog API | PostgreSQL Database | Encrypted connection, Parameterized queries |

## STRIDE Analysis
| Threat | Component | Risk | Attack Scenario | Mitigation |
|--------|-----------|------|-----------------|------------|
| Spoofing | API Endpoints | High | An attacker could try to spoof a legitimate user or an internal system to perform unauthorized actions (e.g., update product details if not properly authenticated/authorized). | Strong authentication (JWT), Authorization (RBAC), mTLS between services. |
| Tampering | Product Data | High | An attacker could tamper with product details (price, description) via unauthorized API calls or SQL injection. | Input validation, Parameterized queries, RBAC, Data integrity checks. |
| Repudiation | Product Updates | Medium | An authorized user (e.g., an admin) could deny making changes to product data. | Comprehensive audit logging for all sensitive actions (create, update, delete). |
| Info Disclosure | Error Responses, API Endpoints | Medium | Error messages could leak database schema or internal paths. Unauthorized access to product data (e.g., hidden products, supplier info). | Generic error responses, Least privilege for API keys/tokens, RBAC, Data redaction for sensitive fields. |
| DoS | API Endpoints | High | An attacker could flood the API with requests, exhausting server resources and making the service unavailable. | Rate limiting at API Gateway and application level, Circuit breakers, Load balancing. |
| Elevation of Privilege | API Endpoints | Critical | An unauthenticated or low-privileged user could gain administrative access to modify or delete products. | Strict RBAC enforcement, Least privilege principle, Secure API key management. |

## Attack Surface Inventory
- **External**: Public API endpoints for product listing, search, and details. Authenticated endpoints for product creation/update/deletion.
- **Internal**: Database connections, potential internal health check endpoints.
- **Data**: Product details stored in PostgreSQL.
- **Infrastructure**: Kubernetes cluster, Docker images, CI/CD pipeline, secrets management for database credentials.
- **Supply Chain**: Third-party Python libraries (FastAPI, Pydantic, SQLAlchemy, Psycopg2).