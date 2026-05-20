# Secure Code Review: Simple E-commerce Product Catalog API (`product_api.py`)

**Date**: 2024-07-30 | **Version**: 1.0 | **Author**: Security Engineer

## Overview
This review focuses on `product_api.py`, a FastAPI application for managing product catalog data. The primary goal is to identify common web application vulnerabilities, particularly those related to the OWASP Top 10.

## Findings

### 1. Critical: SQL Injection Across Multiple Endpoints

**Description**: The application constructs SQL queries by directly concatenating user-supplied input into the query string without proper sanitization or using parameterized queries. This allows an attacker to inject malicious SQL code, potentially leading to data exfiltration, modification, or even remote code execution on the database server.

**Affected Endpoints & Parameters**:
- `GET /products`:
    - `category` parameter
    - `search` parameter
- `GET /products/{product_id}`:
    - `product_id` path parameter
- `POST /products`:
    - `name`, `description`, `price`, `category`, `stock` fields in the request body
- `PUT /products/{product_id}`:
    - `product_id` path parameter
    - `name`, `description`, `price`, `category`, `stock` fields in the request body
- `DELETE /products/{product_id}`:
    - `product_id` path parameter

**Proof of Exploitability (Example for `GET /products` with `category`)**:
An attacker could send a request like:
`GET /products?category=electronics%27%20OR%201=1--`

This would result in a SQL query similar to:
`SELECT id, name, description, price, category, stock FROM products WHERE 1=1 AND category = 'electronics' OR 1=1--'`

The `--` comments out the rest of the original query, and `OR 1=1` makes the condition always true, effectively returning all products regardless of category, or potentially executing arbitrary SQL if the attacker crafts a more complex payload.

**Severity**: Critical
**CWE**: CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')

**Remediation**:
Always use parameterized queries (prepared statements) for all database interactions. Most database drivers, including `psycopg2`, support this. Never concatenate user input directly into SQL strings.

```python
# Example Remediation for list_products:
@app.get("/products")
async def list_products_secure(category: str | None = None, search: str | None = None):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = "SELECT id, name, description, price, category, stock FROM products WHERE 1=1"
    params = []

    if category:
        query += " AND category = %s"
        params.append(category)
    if search:
        query += " AND (name ILIKE %s OR description ILIKE %s)"
        params.append(f'%{search}%')
        params.append(f'%{search}%')

    try:
        cursor.execute(query, params) # Pass parameters separately
        products = cursor.fetchall()
        return products
    except Exception as e:
        print(f"Error listing products: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve products")
    finally:
        cursor.close()
        conn.close()

# Example Remediation for create_product:
@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product_secure(product: Product):
    # Add authentication/authorization here
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        INSERT INTO products (name, description, price, category, stock)
        VALUES (%s, %s, %s, %s, %s)
    """
    try:
        cursor.execute(query, (
            product.name,
            product.description,
            product.price,
            product.category,
            product.stock
        ))
        conn.commit()
        return {"message": "Product created successfully"}
    except Exception as e:
        print(f"Error creating product: {e}")
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create product")
    finally:
        cursor.close()
        conn.close()
```

### 2. Critical: Missing Authentication and Authorization

**Description**: The `POST /products`, `PUT /products/{product_id}`, and `DELETE /products/{product_id}` endpoints lack any form of authentication or authorization. This means any unauthenticated user can create, update, or delete product information, leading to complete data integrity compromise and potential denial of service.

**Affected Endpoints**:
- `POST /products`
- `PUT /products/{product_id}`
- `DELETE /products/{product_id}`

**Proof of Exploitability**:
An attacker can simply send a `POST` request to `/products` with a valid product JSON body, and the product will be created. Similarly, `PUT` and `DELETE` requests can be made without any credentials.

**Severity**: Critical
**CWE**: CWE-284: Improper Access Control

**Remediation**:
Implement robust authentication (e.g., JWT, OAuth2) and authorization (e.g., RBAC) mechanisms. For FastAPI, this can be achieved using `fastapi.security` and `Depends` to inject authenticated user information and check their roles/permissions before allowing access to sensitive endpoints.

```python
# Example Remediation (Conceptual with JWT):
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt # Assuming pyjwt

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # In a real app, validate token signature, expiry, issuer, audience
        # and retrieve user roles/permissions from the payload or a user service.
        payload = jwt.decode(credentials.credentials, "your-secret-key", algorithms=["HS256"])
        # For simplicity, assume payload contains a 'role' field
        return payload # Or a User object
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

async def verify_admin_role(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return current_user

@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product_secure(product: Product, admin_user: dict = Depends(verify_admin_role)):
    # ... (rest of the create product logic, now protected) ...
    return {"message": f"Product created by {admin_user.get('sub')} successfully"}
```

### 3. High: Hardcoded Database Credentials and Direct Connection

**Description**: The `DATABASE_URL` is retrieved from an environment variable but the default value `dbname=products user=admin password=password host=localhost` contains hardcoded, weak credentials. Additionally, the `get_db_connection` function creates a new database connection for every request, which is inefficient and can lead to connection exhaustion under load.

**Affected Component**: `DATABASE_URL` variable and `get_db_connection` function.

**Proof of Exploitability**:
If the environment variable is not set, the application will attempt to connect with `user=admin` and `password=password`. This is a common default credential that attackers would try, potentially gaining full database access.

**Severity**: High
**CWE**: CWE-798: Use of Hard-coded Credentials
**CWE**: CWE-400: Uncontrolled Resource Consumption ('Connection Exhaustion')

**Remediation**:
- **Secrets Management**: Never hardcode credentials. Use a dedicated secrets management solution (e.g., HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Kubernetes Secrets with encryption-at-rest) to store and retrieve sensitive information securely. Ensure environment variables are only used for non-sensitive configuration or references to secrets.
- **Database Connection Pooling**: Implement a connection pool (e.g., `asyncpg` for async, `SQLAlchemy` with a connection pool) to efficiently manage database connections, reducing overhead and preventing connection exhaustion.

```python
# Example Remediation (Conceptual for Secrets Management and Connection Pooling):
import databases # For async database operations and connection pooling

# Configuration: Load from environment variables, no hardcoded defaults for sensitive info
DATABASE_URL = os.getenv("DATABASE_URL") # Ensure this is set securely in deployment
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

database = databases.Database(DATABASE_URL)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# Then, use 'database' object in endpoints:
@app.get("/products")
async def list_products_secure(category: str | None = None, search: str | None = None):
    query = "SELECT id, name, description, price, category, stock FROM products WHERE 1=1"
    params = {}
    if category:
        query += " AND category = :category"
        params["category"] = category
    if search:
        query += " AND (name ILIKE :search_name OR description ILIKE :search_desc)"
        params["search_name"] = f'%{search}%'
        params["search_desc"] = f'%{search}%'

    products = await database.fetch_all(query=query, values=params)
    return products
```

### 4. Medium: Verbose Error Messages / Information Disclosure

**Description**: The `except Exception as e:` blocks catch generic exceptions and print the full exception message (`print(f"Error ...: {e}")`) to the console (which might end up in logs accessible to attackers or in verbose error responses). While the API returns a generic `"Failed to retrieve products"`, the internal logging of full stack traces or error details can still aid an attacker in understanding the system's internals, database structure, or potential vulnerabilities.

**Affected Components**: All `try...except` blocks in API endpoints.

**Proof of Exploitability**:
By triggering various errors (e.g., malformed requests, non-existent IDs), an attacker could observe detailed error logs if they have access to the logging system, or if the `detail` message were less generic.

**Severity**: Medium
**CWE**: CWE-200: Exposure of Sensitive Information to an Unauthorized Actor

**Remediation**:
- **Generic Error Responses**: Ensure that error messages returned to the client are generic and do not contain sensitive information (e.g., stack traces, internal paths, database errors). The current implementation generally does this for the client, but the internal logging needs attention.
- **Structured Logging**: Use a structured logging library (e.g., `structlog`, `logging` module with JSON formatter) to log errors with relevant context (request ID, endpoint, user ID) but avoid logging raw exception objects directly in production. Configure logging levels appropriately.
- **Centralized Logging**: Send logs to a centralized logging system (e.g., ELK stack, Splunk, Datadog) where they can be securely stored, monitored, and analyzed by authorized personnel.

```python
# Example Remediation (Conceptual for Logging):
import logging

logger = logging.getLogger(__name__)

@app.get("/products")
async def list_products_secure(category: str | None = None, search: str | None = None):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    # ... (secure query construction) ...
    try:
        cursor.execute(query, params)
        products = cursor.fetchall()
        return products
    except Exception as e:
        logger.error("Failed to retrieve products", exc_info=True, extra={
            "endpoint": "/products",
            "category_param": category,
            "search_param": search
        }) # Log full exception details internally, but not to client
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve products")
    finally:
        cursor.close()
        conn.close()
```

### 5. Low: Missing Input Validation Beyond Pydantic Types

**Description**: While Pydantic provides basic type validation, there isn't explicit business logic validation for all inputs. For example, `product.name` or `product.description` could contain excessively long strings, leading to database storage issues or potential denial-of-service if memory is exhausted during processing. `category` could also be an arbitrary string, potentially leading to inconsistent data.

**Affected Components**: `Product` and `ProductUpdate` models.

**Proof of Exploitability**:
An attacker could send a `POST /products` request with a product name that is 10,000 characters long. While Pydantic handles the string type, it doesn't enforce length limits, which could cause issues downstream.

**Severity**: Low
**CWE**: CWE-20: Improper Input Validation

**Remediation**:
Implement comprehensive input validation, including length constraints, format checks (e.g., regex for specific fields), and business logic validation (e.g., ensuring `category` is from a predefined list). Pydantic's `Field` and `field_validator` can be used effectively for this.

```python
# Example Remediation for Product model:
from pydantic import BaseModel, Field, field_validator

class Product(BaseModel):
    name: str = Field(..., min_length=3, max_length=100) # Add length constraints
    description: str | None = Field(None, max_length=1000) # Add length constraints
    price: float = Field(..., gt=0)
    category: str | None = Field(None, max_length=50) # Add length constraints
    stock: int = Field(default=0, ge=0)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str | None) -> str | None:
        if v and v.lower() not in ["electronics", "books", "clothing", "home"]:
            raise ValueError("Invalid category") # Example: enforce predefined categories
        return v
```

## Summary of Recommendations

1.  **Implement Parameterized Queries**: This is the most critical fix. Refactor all database queries to use parameterized statements to prevent SQL injection.
2.  **Add Authentication and Authorization**: Secure all sensitive endpoints (`POST`, `PUT`, `DELETE`) with proper authentication and role-based access control.
3.  **Secure Secrets Management**: Remove hardcoded credentials and implement a robust secrets management solution. Use a database connection pool.
4.  **Improve Error Handling and Logging**: Ensure internal error logging is structured and does not expose sensitive details to unauthorized parties. Client-facing errors should remain generic.
5.  **Enhance Input Validation**: Add more granular validation rules (e.g., length, format, allowed values) to Pydantic models to prevent various input-related attacks and data integrity issues.
6.  **Add Rate Limiting**: Implement rate limiting on all public-facing API endpoints to prevent DoS attacks and brute-force attempts.
7.  **Implement Security Headers**: Configure appropriate security headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`) in the FastAPI application or API Gateway.

These recommendations should be prioritized, with SQL Injection and Missing Authentication/Authorization being addressed immediately due to their critical severity.