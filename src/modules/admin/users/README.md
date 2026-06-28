# Admin Users Module

Gestión de acceso manual — Sprint 3.

## Responsabilidades

- Listar usuarios (profiles vía RLS admin + emails vía Auth Admin API)
- Crear usuarios (`createUserByAdmin` — service role solo para Auth)
- Actualizar perfiles (`updateProfileAsAdmin` — cliente autenticado + RLS)
- Auditoría básica (`admin_audit_log`)

## Service role

Usado **únicamente** en:

- `queries/fetch-user-emails.ts` — `auth.admin.listUsers()`
- `actions/create-user-by-admin.ts` — `auth.admin.createUser()`

Nunca expuesto al cliente.

## Server Actions públicas

Ver `index.ts`.
