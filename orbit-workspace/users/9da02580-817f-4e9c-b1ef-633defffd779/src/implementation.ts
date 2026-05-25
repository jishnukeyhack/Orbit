This implementation provides a complete JWT authentication system with refresh tokens, including login, logout, token refresh, and a middleware for protecting routes. It uses `express` for the server, `jsonwebtoken` for JWT operations, and `bcrypt` for password hashing.

### Project Setup

First, create a new project and install the necessary dependencies:

```bash
mkdir jwt-auth-app
cd jwt-auth-app
npm init -y
npm install express jsonwebtoken bcrypt uuid
npm install -D typescript ts-node-dev @types/express @types/jsonwebtoken @types/bcrypt @types/uuid
```

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Add a start script to your `package.json`:

```json
{
  "name": "jwt-auth-app",
  "version": "1.0.0",
  "description": "",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.5",
    "@types/uuid": "^9.0.8",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

### Project Structure

```
src/
  app.ts
  config.ts
  middleware/
    auth.middleware.ts
    error.middleware.ts
  routes/
    auth.routes.ts
    user.routes.ts
  services/
    auth.service.ts
    user.service.ts
  types/
    express.d.ts
    jwt.d.ts
  utils/
    bcrypt.ts
    errors.ts
```

---

### 1. `src/config.ts`

This file holds our environment variables and JWT secrets. In a real application, these would come from `.env` files.

```typescript
// src/config.ts

export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'supersecretaccesskey';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkey';
export const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d'; // 7 days
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
```

### 2. `src/types/jwt.d.ts`

Define TypeScript interfaces for JWT payloads.

```typescript
// src/types/jwt.d.ts

export interface AccessTokenPayload {
  userId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string; // Unique ID for the refresh token instance
}
```

### 3. `src/types/express.d.ts`

Extend Express's `Request` interface to include the `user` property that our authentication middleware will attach.

```typescript
// src/types/express.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}
```

### 4. `src/utils/errors.ts`

Custom error classes for better error handling.

```typescript
// src/utils/errors.ts

export class HttpError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}
```

### 5. `src/utils/bcrypt.ts`

Utility functions for password hashing and comparison.

```typescript
// src/utils/bcrypt.ts

import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config';

/**
 * Hashes a plain text password.
 * @param password The password to hash.
 * @returns The hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password The plain text password.
 * @param hash The hashed password.
 * @returns True if passwords match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### 6. `src/services/user.service.ts`

This service manages user data and refresh tokens. For simplicity, it uses in-memory storage. In a production app, this would interact with a database.

```typescript
// src/services/user.service.ts

import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/bcrypt';

interface User {
  id: string;
  username: string;
  passwordHash: string;
}

interface StoredRefreshToken {
  userId: string;
  tokenId: string; // Unique ID for this specific refresh token
  token: string; // The actual JWT refresh token string
}

// In-memory storage for users and refresh tokens
const users: User[] = [];
const refreshTokens: StoredRefreshToken[] = [];

/**
 * Initializes a default user for testing.
 */
export const initializeUsers = async () => {
  if (users.length === 0) {
    const passwordHash = await hashPassword('password123');
    users.push({
      id: uuidv4(),
      username: 'testuser',
      passwordHash: passwordHash,
    });
    console.log('Default user "testuser" created with password "password123"');
  }
};

/**
 * Finds a user by their username.
 * @param username The username to search for.
 * @returns The user object or undefined if not found.
 */
export const findUserByUsername = (username: string): User | undefined => {
  return users.find((user) => user.username === username);
};

/**
 * Finds a user by their ID.
 * @param id The user ID to search for.
 * @returns The user object or undefined if not found.
 */
export const findUserById = (id: string): User | undefined => {
  return users.find((user) => user.id === id);
};

/**
 * Adds a new refresh token to storage.
 * @param userId The ID of the user associated with the token.
 * @param tokenId The unique ID for this refresh token instance.
 * @param token The refresh token string.
 */
export const addRefreshToken = (userId: string, tokenId: string, token: string): void => {
  refreshTokens.push({ userId, tokenId, token });
};

/**
 * Retrieves a refresh token from storage.
 * @param userId The ID of the user.
 * @param tokenId The unique ID of the refresh token instance.
 * @returns The stored refresh token or undefined.
 */
export const getRefreshToken = (userId: string, tokenId: string): StoredRefreshToken | undefined => {
  return refreshTokens.find((rt) => rt.userId === userId && rt.tokenId === tokenId);
};

/**
 * Deletes a specific refresh token from storage.
 * @param userId The ID of the user.
 * @param tokenId The unique ID of the refresh token instance to delete.
 * @returns True if the token was found and deleted, false otherwise.
 */
export const deleteRefreshToken = (userId: string, tokenId: string): boolean => {
  const initialLength = refreshTokens.length;
  const index = refreshTokens.findIndex((rt) => rt.userId === userId && rt.tokenId === tokenId);
  if (index !== -1) {
    refreshTokens.splice(index, 1);
    return true;
  }
  return false;
};

/**
 * Deletes all refresh tokens associated with a given user.
 * @param userId The ID of the user.
 */
export const deleteAllRefreshTokensForUser = (userId: string): void => {
  const tokensToDelete = refreshTokens.filter((rt) => rt.userId === userId);
  tokensToDelete.forEach((token) => deleteRefreshToken(token.userId, token.tokenId));
};

/**
 * Replaces an old refresh token with a new one.
 * This is crucial for refresh token rotation.
 * @param userId The ID of the user.
 * @param oldTokenId The unique ID of the old refresh token.
 * @param newTokenId The unique ID for the new refresh token.
 * @param newToken The new refresh token string.
 * @returns True if the old token was found and replaced, false otherwise.
 */
export const replaceRefreshToken = (
  userId: string,
  oldTokenId: string,
  newTokenId: string,
  newToken: string
): boolean => {
  const index = refreshTokens.findIndex((rt) => rt.userId === userId && rt.tokenId === oldTokenId);
  if (index !== -1) {
    refreshTokens[index] = { userId, tokenId: newTokenId, token: newToken };
    return true;
  }
  return false;
};

/**
 * Checks if a given refresh token string matches a stored token for a user and tokenId.
 * This is an additional check to prevent token hijacking if the JWT verification passes but the token was revoked.
 * @param userId The ID of the user.
 * @param tokenId The unique ID of the refresh token instance.
 * @param token The refresh token string to validate.
 * @returns True if the token is valid and matches, false otherwise.
 */
export const isRefreshTokenValid = (userId: string, tokenId: string, token: string): boolean => {
  const storedToken = getRefreshToken(userId, tokenId);
  return storedToken?.token === token;
};
```

### 7. `src/services/auth.service.ts`

This service handles the creation and verification of JWTs.

```typescript
// src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} from '../config';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

/**
 * Generates an access token for a given user ID.
 * @param userId The ID of the user.
 * @returns The signed access token.
 */
export const generateAccessToken = (userId: string): string => {
  const payload: AccessTokenPayload = { userId };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
};

/**
 * Generates a refresh token for a given user ID and a unique token ID.
 * @param userId The ID of the user.
 * @param tokenId A unique identifier for this specific refresh token instance.
 * @returns The signed refresh token.
 */
export const generateRefreshToken = (userId: string, tokenId: string): string => {
  const payload: RefreshTokenPayload = { userId, tokenId };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
};

/**
 * Verifies an access token.
 * @param token The access token string.
 * @returns The decoded payload if valid.
 * @throws UnauthorizedError if the token is invalid or expired.
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired');
    }
    throw new UnauthorizedError('Invalid access token');
  }
};

/**
 * Verifies a refresh token.
 * @param token The refresh token string.
 * @returns The decoded payload if valid.
 * @throws ForbiddenError if the token is invalid or expired.
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new ForbiddenError('Refresh token expired');
    }
    throw new ForbiddenError('Invalid refresh token');
  }
};

/**
 * Generates a new unique ID for a refresh token.
 * This is used to track individual refresh token instances for rotation.
 * @returns A unique string ID.
 */
export const generateRefreshTokenId = (): string => {
  return uuidv4();
};
```

### 8. `src/middleware/auth.middleware.ts`

Middleware to protect routes by verifying the access token.

```typescript
// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

/**
 * Middleware to authenticate requests using an access token.
 * Extracts the token from the Authorization header, verifies it,
 * and attaches the user ID to the request object.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(new UnauthorizedError('Access token is required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId };
    next();
  } catch (error) {
    next(error); // Pass UnauthorizedError or other errors to the error handling middleware
  }
};
```

### 9. `src/middleware/error.middleware.ts`

A global error handling middleware for Express.

```typescript
// src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

/**
 * Global error handling middleware.
 * Catches errors thrown in routes and other middleware,
 * and sends a standardized error response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err); // Log the error for debugging

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  // Default to 500 Internal Server Error for unhandled errors
  res.status(500).json({
    message: 'Internal Server Error',
    statusCode: 500,
  });
};
```

### 10. `src/routes/auth.routes.ts`

Defines the authentication endpoints: login, refresh, and logout.

```typescript
// src/routes/auth.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import {
  findUserByUsername,
  addRefreshToken,
  deleteRefreshToken,
  isRefreshTokenValid,
  replaceRefreshToken,
  deleteAllRefreshTokensForUser,
} from '../services/user.service';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRefreshTokenId,
} from '../services/auth.service';
import { comparePassword } from '../utils/bcrypt';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors';

const router = Router();

/**
 * @route POST /auth/login
 * @description Authenticates a user and issues access and refresh tokens.
 * @access Public
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new BadRequestError('Username and password are required');
    }

    const user = findUserByUsername(username);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = generateAccessToken(user.id);
    const refreshTokenId = generateRefreshTokenId(); // Unique ID for this refresh token instance
    const refreshToken = generateRefreshToken(user.id, refreshTokenId);

    // Store the refresh token
    addRefreshToken(user.id, refreshTokenId, refreshToken);

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /auth/refresh
 * @description Refreshes an access token using a valid refresh token.
 *              Implements refresh token rotation.
 * @access Public
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    // 1. Verify the old refresh token's signature and expiry
    const payload = verifyRefreshToken(oldRefreshToken);
    const { userId, tokenId: oldTokenId } = payload;

    // 2. Check if the refresh token exists and is valid in our storage
    // This prevents using revoked tokens or tokens that don't match what we issued
    if (!isRefreshTokenValid(userId, oldTokenId, oldRefreshToken)) {
      // If the token is valid JWT-wise but not in our store, it might be a stolen token.
      // Invalidate all tokens for this user to mitigate.
      deleteAllRefreshTokensForUser(userId);
      throw new ForbiddenError('Invalid or revoked refresh token. Please log in again.');
    }

    // 3. Generate new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshTokenId = generateRefreshTokenId();
    const newRefreshToken = generateRefreshToken(userId, newRefreshTokenId);

    // 4. Replace the old refresh token with the new one (rotation)
    const replaced = replaceRefreshToken(userId, oldTokenId, newRefreshTokenId, newRefreshToken);

    if (!replaced) {
      // This should ideally not happen if isRefreshTokenValid passed, but as a safeguard
      deleteAllRefreshTokensForUser(userId);
      throw new ForbiddenError('Failed to replace refresh token. Please log in again.');
    }

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /auth/logout
 * @description Invalidates a refresh token, effectively logging out the user from that session.
 * @access Public (requires refresh token in body)
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    // Verify the refresh token to get user ID and token ID
    const payload = verifyRefreshToken(refreshToken);
    const { userId, tokenId } = payload;

    // Delete the specific refresh token from storage
    const deleted = deleteRefreshToken(userId, tokenId);

    if (!deleted) {
      // If the token wasn't found, it might have already been logged out or is invalid
      // We can still return success as the goal (token invalidation) is achieved.
      console.warn(`Attempted to logout with non-existent or already deleted refresh token for user ${userId}, tokenId ${tokenId}`);
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### 11. `src/routes/user.routes.ts`

An example of a protected route.

```typescript
// src/routes/user.routes.ts

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { findUserById } from '../services/user.service';
import { NotFoundError } from '../utils/errors';

const router = Router();

/**
 * @route GET /users/me
 * @description Returns information about the authenticated user.
 * @access Private (requires access token)
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  // req.user is populated by the authenticateToken middleware
  const userId = req.user?.id;

  if (!userId) {
    // This case should ideally not be reached if authenticateToken works correctly
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const user = findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Return sensitive data carefully, typically only public profile info
  res.json({
    id: user.id,
    username: user.username,
    message: `Welcome, ${user.username}! This is a protected route.`,
  });
});

export default router;
```

### 12. `src/app.ts`

The main Express application file.

```typescript
// src/app.ts

import express from 'express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { initializeUsers } from './services/user.service';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize default users (for demonstration purposes)
initializeUsers();

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Global error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test user: username='testuser', password='password123'`);
  console.log(`Access login endpoint: POST http://localhost:${PORT}/auth/login`);
  console.log(`Access protected endpoint: GET http://localhost:${PORT}/users/me`);
});
```

---

### How to Run and Test

1.  **Build the project:**
    ```bash
    npm run build
    ```
2.  **Start the server:**
    ```bash
    npm run dev # For development with auto-restarts
    # OR
    npm start # For production (after building)
    ```
    You should see output like:
    ```
    Server running on port 3000
    Test user: username='testuser', password='password123'
    Access login endpoint: POST http://localhost:3000/auth/login
    Access protected endpoint: GET http://localhost:3000/users/me
    ```

3.  **Test with a tool like Postman or cURL:**

    **a. Login**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:3000/auth/login`
    *   **Headers:** `Content-Type: application/json`
    *   **Body (raw JSON):**
        ```json
        {
            "username": "testuser",
            "password": "password123"
        }
        ```
    *   **Expected Response (200 OK):**
        ```json
        {
            "accessToken": "eyJ...",
            "refreshToken": "eyJ..."
        }
        ```
        *Save these tokens for subsequent requests.*

    **b. Access Protected Route (without token - should fail)**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3000/users/me`
    *   **Expected Response (401 Unauthorized):**
        ```json
        {
            "message": "Access token is required",
            "statusCode": 401
        }
        ```

    **c. Access Protected Route (with valid access token)**
    *   **Method:** `GET`
    *   **URL:** `http://localhost