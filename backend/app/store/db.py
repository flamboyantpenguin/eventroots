import json
from datetime import datetime
from typing import Any, List, LiteralString, Optional
from uuid import UUID

import asyncpg
from redis import asyncio as aioredis
from typing_extensions import cast

from app.schemas.auth_schema import SessionModel
from app.schemas.category_schema import CategoryModel
from app.schemas.event_schema import EventModel, TemplateModel
from app.schemas.user_schema import AdminModel, UserModel
from app.schemas.vendor_schema import VendorModel

redis_client: aioredis.Redis | None = None
pg_pool: Optional[asyncpg.Pool] = None


class DatabaseStore:
    """Public Database Store module providing structured access to PostgreSQL content tables."""

    @staticmethod
    async def _execute_query(
        query: LiteralString, params: Optional[tuple] = None, fetch_all: bool = True
    ) -> Any:
        if not pg_pool:
            raise RuntimeError("PostgreSQL engine is uninitialized.")

        p = params or ()
        async with pg_pool.acquire() as conn:
            if fetch_all:
                return await conn.fetch(query, *p)
                # return [dict(r) for r in results]

            return await conn.fetchrow(query, *p)
            # return dict(result) if result else None

    @staticmethod
    async def _execute_mutation(query: LiteralString, params: tuple) -> None:
        """Write operation manager (INSERT, UPDATE, DELETE) with automatic commits."""
        if not pg_pool:
            raise RuntimeError("PostgreSQL engine is uninitialized.")

        p = params or ()
        async with pg_pool.acquire() as conn:
            await conn.execute(query, *p)

    @staticmethod
    async def _execute_read_on_volatile(key: str) -> Optional[dict[str, Any]]:
        """Isolated helper execution thread keeping query logic DRY and connection-safe."""
        if not redis_client:
            raise RuntimeError("Redis engine is uninitialized.")

        raw_data = await redis_client.get(name=key)

        if raw_data is not None:
            return json.loads(raw_data)
        return None

    @staticmethod
    async def _execute_write_on_volatile(key: str, value: dict, ttl: int) -> None:
        """Isolated helper execution thread keeping query logic DRY and connection-safe."""
        if not redis_client:
            raise RuntimeError("Redis engine is uninitialized.")

        await redis_client.set(name=key, value=json.dumps(value), ex=ttl)

    async def status(self) -> bool:
        try:
            await self._execute_query("SELECT 1")
            return True
        except Exception:
            return False

    async def users(self) -> List[UserModel] | None:
        """Fetch all client users dynamically from the database."""
        query = "SELECT id, username, email, pfp, is_active, last_online FROM users ORDER BY id ASC;"
        rows = await self._execute_query(query)
        return [UserModel.model_validate(dict(row)) for row in rows] if rows else []

    async def vendors(self) -> List[VendorModel]:
        """Fetch the active vendor list with resolved category names."""
        query = """
            SELECT
                v.id,
                v.name,
                c.name as category_name,
                v.category_id,
                v.location,
                v.data
            FROM vendors v
            INNER JOIN category c ON v.category_id = c.id
            ORDER BY v.id ASC;
        """
        rows = await self._execute_query(query, fetch_all=True)
        return [VendorModel.model_validate(dict(row)) for row in rows] if rows else []

    async def categories(self) -> List[CategoryModel]:
        """Fetch the active vendor list data schema on demand."""
        query = "SELECT id, name FROM category;"
        rows = await self._execute_query(query, fetch_all=True)
        return [CategoryModel.model_validate(dict(row)) for row in rows] if rows else []

    async def templates(self) -> List[TemplateModel]:
        """Fetch accessible canvas baseline platform design blueprints."""
        query = "SELECT id, title, banner_url, data, flow FROM event_templates ORDER BY id ASC;"
        rows = await self._execute_query(query, fetch_all=True)
        return [TemplateModel.model_validate(dict(row)) for row in rows] if rows else []

    async def get_user_by_id(self, user_id: UUID) -> UserModel | None:
        """Fetch a single user profile from the database by their unique UUID."""
        query = "SELECT id, username, email, pfp, is_active, last_online FROM users WHERE id = $1;"

        row = await self._execute_query(query, (user_id,), fetch_all=False)
        return UserModel.model_validate(dict(row)) if row else None

    async def get_user_by_email(self, email: str) -> UserModel | None:
        """Fetch a single user profile from the database by their email"""
        query = "SELECT id, username, email, pfp, is_active, last_online FROM users WHERE email = $1;"
        row = await self._execute_query(query, (email,), fetch_all=False)
        return UserModel.model_validate(dict(row)) if row else None

    async def get_user_password_by_email(self, email: str) -> str | None:
        """Fetch a single user's hashed password string by their email address."""
        query = "SELECT hashed_password FROM users WHERE email = $1;"
        result = await self._execute_query(query, (email,), fetch_all=False)

        if not result:
            return None

        return str(result["hashed_password"])

    async def get_admin_by_id(self, user_id: UUID) -> AdminModel | None:
        """Fetch a single user profile from the database by their unique UUID."""
        query = "SELECT id, email, pfp FROM admin WHERE id = $1;"
        row = await self._execute_query(query, (user_id,), fetch_all=False)
        return AdminModel.model_validate(dict(row)) if row else None

    async def get_admin_by_email(self, email: str) -> AdminModel | None:
        """Fetch a single admin profile from the database by their email"""
        query = "SELECT id, email, pfp FROM admin WHERE email = $1;"
        row = await self._execute_query(query, (email,), fetch_all=False)
        return AdminModel.model_validate(dict(row)) if row else None

    async def get_admin_password_by_email(self, email: str) -> str | None:
        """Fetch a single admin's hashed password string by their email address."""
        query = "SELECT hashed_password FROM admin WHERE email = $1;"
        result = await self._execute_query(query, (email,), fetch_all=False)

        if not result:
            return None

        return str(result["hashed_password"])

    async def set_user_to_be_deleted_by_id(self, user_id: UUID) -> None:
        """Set a user to be deleted by setting the status to inactive"""
        query = "UPDATE users SET is_active = FALSE WHERE id = $1;"
        await self._execute_mutation(query, (user_id,))

    async def get_event_by_id(self, event_id: UUID) -> EventModel | None:
        """Fetch an event data from the database by id"""
        query = "SELECT id, user_id, title, banner_url, data, flow FROM events WHERE id = $1;"

        row = await self._execute_query(query, (event_id,), fetch_all=False)
        return EventModel.model_validate(dict(row)) if row else None

    async def get_template_by_id(self, template_id: UUID) -> TemplateModel | None:
        """Fetch an event data from the database by id"""
        query = "SELECT id, title, banner_url, data, flow FROM event_templates WHERE id = $1;"
        row = await self._execute_query(query, (template_id,), fetch_all=False)
        return TemplateModel.model_validate(dict(row)) if row else None

    async def get_event_by_user_id(self, user_id: UUID) -> List[EventModel]:
        """Fetch an event data from the database by id"""
        query = "SELECT id, user_id, title, banner_url, data, flow FROM events WHERE user_id = $1;"

        row = await self._execute_query(query, (user_id,), fetch_all=True)
        return row

    async def update_event_state(
        self, event_id: Any, title: str, data: dict, flow: dict
    ) -> None:
        """Update a specific event's full tracking state inside PostgreSQL."""
        query = """
                UPDATE events
                SET title = $1, data = $2::jsonb, flow = $3::jsonb
                WHERE id = $4;
            """
        await self._execute_mutation(
            query,
            (
                title,
                data,
                flow,
                str(event_id),
            ),
        )

    async def update_user_status(self, user_id: int, is_active: bool) -> None:
        """Toggle a user's active access status flag."""
        query = "UPDATE users SET is_active = $1 WHERE id = $2;"
        await self._execute_mutation(query, (is_active, user_id))

    async def delete_event_by_id(self, event_id: UUID) -> None:
        """Delete an event by it's ID"""
        query = "DELETE FROM events WHERE id = $1;"
        await self._execute_mutation(query, (event_id,))

    async def create_user(
        self,
        username: str,
        email: str,
        hashed_password: str,
        pfp: str | None = None,
    ) -> None:
        pfp = pfp if pfp is not None else "/static/uploads/pfp/default.svg"
        """Onboard a brand new vendor instance into live storage."""
        query = """
            INSERT INTO users (username, email, hashed_password, pfp)
            VALUES ($1, $2, $3, $4);
        """
        await self._execute_mutation(query, (username, email, hashed_password, pfp))

    async def update_user(
        self,
        user_id: str,
        username: str | None = None,
        email: str | None = None,
        hashed_password: str | None = None,
        pfp: str | None = None,
        is_active: bool | None = None,
    ) -> None:
        """Updates an existing user profile record dynamically based on provided fields."""
        fields_to_update = []
        params = []

        param_index = 1

        if username is not None:
            fields_to_update.append(f"username = ${param_index}")
            params.append(username)
            param_index += 1

        if email is not None:
            fields_to_update.append(f"email = ${param_index}")
            params.append(email)
            param_index += 1

        if hashed_password is not None:
            fields_to_update.append(f"hashed_password = ${param_index}")
            params.append(hashed_password)
            param_index += 1

        if pfp is not None:
            fields_to_update.append(f"pfp = ${param_index}")
            params.append(pfp)
            param_index += 1

        if is_active is not None:
            fields_to_update.append(f"is_active = ${param_index}")
            params.append(is_active)
            param_index += 1

        if not fields_to_update:
            return

        where_id_index = param_index
        params.append(user_id)

        generated_query = f"""
            UPDATE users
            SET {", ".join(fields_to_update)}
            WHERE id = ${where_id_index};
        """

        query: LiteralString = cast(LiteralString, generated_query)

        await self._execute_mutation(query, tuple(params))

    async def create_event(
        self,
        title: str,
        banner_url: str | None,
        user_id: UUID,
        data: dict | None,
        flow: dict | None,
    ) -> str:
        """Onboard a brand new event instance into live storage."""
        query = """
                INSERT INTO events (title, banner_url, user_id, data, flow)
                VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
                RETURNING id;
            """
        result = await self._execute_query(
            query,
            (title, banner_url, user_id, json.dumps(data), json.dumps(flow)),
            fetch_all=False,
        )
        if not result:
            raise ValueError("Database failed to insert record and return ID.")

        return str(result["id"])

    async def update_event(self, event_id: UUID, updates: dict) -> TemplateModel | None:
        """Dynamically updates JSONB fields and standard columns securely using sequential indexing."""
        if not updates:
            return None

        set_fields = []
        set_params = []

        param_index = 1
        json_columns = {"data": "data", "flow": "flow"}

        for key, value in updates.items():
            if key in json_columns and isinstance(value, dict):
                keys_to_delete = [
                    k
                    for k, v in value.items()
                    if v is None or v == "" or (isinstance(v, (list, dict)) and not v)
                ]

                clean_updates = {
                    k: v
                    for k, v in value.items()
                    if v is not None and k not in keys_to_delete
                }

                sql_expr = json_columns[key]

                for dead_key in keys_to_delete:
                    sql_expr = f"({sql_expr} - ${param_index})"
                    set_params.append(dead_key)
                    param_index += 1

                if clean_updates:
                    sql_expr = f"{sql_expr} || ${param_index}::jsonb"

                    set_params.append(json.dumps(clean_updates))
                    param_index += 1

                set_fields.append(f"{json_columns[key]} = {sql_expr}")

            else:
                set_fields.append(f"{key} = ${param_index}")
                set_params.append(value)
                param_index += 1

        set_fields.append("updated_at = CURRENT_TIMESTAMP")

        id_param_idx = param_index

        set_params.append(event_id)

        gen_query = f"""
            UPDATE events
            SET {", ".join(set_fields)}
            WHERE id = ${id_param_idx}
            RETURNING id, title, banner_url, data, flow;
        """

        query: LiteralString = cast(LiteralString, gen_query)

        row = await self._execute_query(query, tuple(set_params), fetch_all=False)
        return TemplateModel.model_validate(dict(row))

    async def create_session(
        self,
        user_id: str,
        session_token: str,
        expires_at: datetime,
        is_admin: bool = False,
    ) -> None:
        """Onboard a brand new vendor instance into live storage."""

        query = """
            INSERT INTO sessions (user_id, session_token, expires_at, is_admin)
            VALUES ($1, $2, $3, $4);
        """
        await self._execute_mutation(
            query, (user_id, session_token, expires_at, is_admin)
        )

        if redis_client:
            payload = {
                "user_id": user_id,
                "expires_at": expires_at.isoformat(),
            }

            key = (
                f"session:admin:{session_token}"
                if is_admin
                else f"session:user:{session_token}"
            )

            await self._execute_write_on_volatile(
                key, payload, int(expires_at.timestamp())
            )

    async def get_session_by_token(self, session_token: str) -> SessionModel | None:
        """Retrieve an active session footprint, prioritizing fast-pass cache with fallback."""

        if redis_client:
            admin_key = f"session:admin:{session_token}"
            user_key = f"session:user:{session_token}"

            async with redis_client.pipeline() as pipe:
                pipe.get(admin_key)
                pipe.get(user_key)
                admin_data, user_data = await pipe.execute()

            raw_cached = admin_data or user_data
            if raw_cached:
                return SessionModel.model_validate_json(raw_cached)

        query = """
            SELECT user_id, is_admin, expires_at
            FROM sessions
            WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP;
        """

        session_record = await self._execute_query(
            query, (session_token,), fetch_all=False
        )

        if not session_record:
            return None

        session_data = dict(session_record)

        if redis_client:
            key = (
                f"session:admin:{session_token}"
                if session_data["is_admin"]
                else f"session:user:{session_token}"
            )
            payload = {
                "user_id": str(session_data["user_id"]),
                "expires_at": session_data["expires_at"].isoformat(),
            }
            remaining_ttl = max(
                1,
                int(
                    (
                        session_data["expires_at"]
                        - datetime.now(session_data["expires_at"].tzinfo)
                    ).total_seconds()
                ),
            )
            await self._execute_write_on_volatile(key, payload, ttl=remaining_ttl)

        return SessionModel.model_validate(session_data)

    async def delete_session_by_token(self, session_token: str) -> None:
        """Purge an active session token row completely from all storage tiers upon logout."""

        query = "DELETE FROM sessions WHERE session_token = $1;"
        await self._execute_mutation(query, (session_token,))

        if redis_client:
            async with redis_client.pipeline() as pipe:
                pipe.delete(f"session:user:{session_token}")
                pipe.delete(f"session:admin:{session_token}")
                await pipe.execute()

    async def delete_expired_sessions(self) -> int:
        """Purge an active session token row completely from storage upon logout."""
        query = """
        WITH targeted_deletions AS (
            DELETE FROM sessions
            WHERE expires_at < CURRENT_TIMESTAMP
            RETURNING id
        )
        SELECT COUNT(*) AS deleted_count FROM targeted_deletions;
        """
        result = await self._execute_query(query, (), fetch_all=False)
        if result:
            return int(result["deleted_count"])
        return 0


db = DatabaseStore()
