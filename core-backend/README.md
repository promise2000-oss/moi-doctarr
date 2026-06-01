# MoiDoctor API

## Base URL

Production API:

https://core-backend-azhp.onrender.com

All API routes are prefixed with:

```txt
/api/v1
```

Example:

```txt
https://core-backend-azhp.onrender.com/api/v1/checkHealth
```

---

## Health Check

| Method | Endpoint       | Full URL                                                    |
| ------ | -------------- | ----------------------------------------------------------- |
| GET    | `/checkHealth` | `https://core-backend-azhp.onrender.com/api/v1/checkHealth` |

Response:

```json
{
  "msg": "successful"
}
```

---

## Authentication

| Method | Endpoint                     | Description                                       |
| ------ | ---------------------------- | ------------------------------------------------- |
| POST   | `/auth/manualAuthentication` | Manual sign-up / sign-in using email and password |
| POST   | `/auth/google`               | Google sign-in / sign-up                          |
| POST   | `/auth/apple`                | Apple sign-in / sign-up                           |
| POST   | `/auth/verify`               | Verify user account with verification code        |

Example:

```txt
POST https://core-backend-azhp.onrender.com/api/v1/auth/google
```

---

## User Profile

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/user/listData`       | Get authenticated user profile |
| PUT    | `/user/updateProfile`  | Update profile information     |
| POST   | `/user/forgotPassword` | Reset password                 |
| GET    | `/user/notifications`  | Get user notifications         |
| DELETE | `/user`                | Delete authenticated account   |

---

## Medication Management

| Method | Endpoint             | Description              |
| ------ | -------------------- | ------------------------ |
| POST   | `/medication/create` | Create medication record |
| GET    | `/medication`        | List medications         |
| PUT    | `/medication/stop`   | Stop medication          |

---

## Triage & Symptom Logging

| Method | Endpoint          | Description              |
| ------ | ----------------- | ------------------------ |
| POST   | `/triage`         | Create triage assessment |
| GET    | `/triage/history` | Retrieve triage history  |
| GET    | `/triage/list`    | List triage records      |
| POST   | `/symptom`        | Log symptom              |
| GET    | `/symptom/list`   | List symptom logs        |

---

## Admin Routes

Protected routes requiring admin privileges.

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/admin/users`          | Retrieve all users  |
| PUT    | `/admin/user/role`      | Update user role    |
| PUT    | `/admin/user/blacklist` | Blacklist a user    |
| GET    | `/admin/user/:id`       | Retrieve user by ID |

---

## Authentication Header

Protected endpoints require a JWT token:

```http
Authorization: Bearer <token>
```

---

## Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Google OAuth
* Apple OAuth
* Nodemailer

---

## Deployment

Backend API:

https://core-backend-azhp.onrender.com

Health Check:

https://core-backend-azhp.onrender.com/api/v1/checkHealth
