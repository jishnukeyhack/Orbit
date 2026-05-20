
from fastapi import FastAPI, HTTPException, status, Request
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI()

# --- Configuration (Vulnerable: Hardcoded credentials, direct DB connection) ---
DATABASE_URL = os.getenv("DATABASE_URL", "dbname=products user=admin password=password host=localhost")

# --- Models ---
class Product(BaseModel):
    name: str
    description: str | None = None
    price: float = Field(..., gt=0)
    category: str | None = None
    stock: int = Field(default=0, ge=0)

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    category: str | None = None
    stock: int | None = None

# --- Helper to get DB connection (Vulnerable: No connection pooling, direct usage) ---
def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database connection failed")

# --- API Endpoints ---

@app.get("/products")
async def list_products(category: str | None = None, search: str | None = None):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = "SELECT id, name, description, price, category, stock FROM products WHERE 1=1"
    params = []

    if category:
        query += f" AND category = '{category}'" # Vulnerable: SQL Injection via category
    if search:
        query += f" AND (name ILIKE '%{search}%' OR description ILIKE '%{search}%')" # Vulnerable: SQL Injection via search

    try:
        cursor.execute(query, params) # params is empty, not used for injection
        products = cursor.fetchall()
        return products
    except Exception as e:
        print(f"Error listing products: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve products")
    finally:
        cursor.close()
        conn.close()

@app.get("/products/{product_id}")
async def get_product(product_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    query = f"SELECT id, name, description, price, category, stock FROM products WHERE id = {product_id}" # Vulnerable: SQL Injection via product_id

    try:
        cursor.execute(query)
        product = cursor.fetchone()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product
    except Exception as e:
        print(f"Error getting product: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve product")
    finally:
        cursor.close()
        conn.close()

@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(product: Product):
    # No authentication/authorization check here (Vulnerable: Anyone can create products)
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f"""
        INSERT INTO products (name, description, price, category, stock)
        VALUES ('{product.name}', '{product.description}', {product.price}, '{product.category}', {product.stock})
    """ # Vulnerable: SQL Injection via all product fields

    try:
        cursor.execute(query)
        conn.commit()
        return {"message": "Product created successfully"}
    except Exception as e:
        print(f"Error creating product: {e}")
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create product")
    finally:
        cursor.close()
        conn.close()

@app.put("/products/{product_id}")
async def update_product(product_id: int, product_update: ProductUpdate):
    # No authentication/authorization check here (Vulnerable: Anyone can update products)
    conn = get_db_connection()
    cursor = conn.cursor()
    set_clauses = []
    params = []

    if product_update.name:
        set_clauses.append(f"name = '{product_update.name}'") # Vulnerable: SQL Injection
    if product_update.description:
        set_clauses.append(f"description = '{product_update.description}'") # Vulnerable: SQL Injection
    if product_update.price is not None:
        set_clauses.append(f"price = {product_update.price}") # Vulnerable: SQL Injection
    if product_update.category:
        set_clauses.append(f"category = '{product_update.category}'") # Vulnerable: SQL Injection
    if product_update.stock is not None:
        set_clauses.append(f"stock = {product_update.stock}") # Vulnerable: SQL Injection

    if not set_clauses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    query = f"UPDATE products SET {', '.join(set_clauses)} WHERE id = {product_id}" # Vulnerable: SQL Injection via product_id

    try:
        cursor.execute(query)
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return {"message": "Product updated successfully"}
    except Exception as e:
        print(f"Error updating product: {e}")
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update product")
    finally:
        cursor.close()
        conn.close()

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int):
    # No authentication/authorization check here (Vulnerable: Anyone can delete products)
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f"DELETE FROM products WHERE id = {product_id}" # Vulnerable: SQL Injection via product_id

    try:
        cursor.execute(query)
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return
    except Exception as e:
        print(f"Error deleting product: {e}")
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete product")
    finally:
        cursor.close()
        conn.close()

