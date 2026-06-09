import os
from email import message
from typing import Any, Dict, List, LiteralString, Optional
from uuid import UUID

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

DB_URL = os.getenv("DATABASE_URL")


class DatabaseStore:
    """Public Database Store module providing structured access to PostgreSQL content tables."""

    @staticmethod
    def _execute_query(
        query: LiteralString, params: Optional[tuple] = None, fetch_all: bool = True
    ) -> Any:
        """Isolated helper execution thread keeping query logic DRY and connection-safe."""
        if not DB_URL:
            raise RuntimeError(
                "Database configuration context missing from environment variables."
            )

        with psycopg.Connection.connect(DB_URL) as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, params or ())
                return cur.fetchall() if fetch_all else cur.fetchone()

    @staticmethod
    def _execute_mutation(query: LiteralString, params: tuple) -> None:
        """Write operation manager (INSERT, UPDATE, DELETE) with automatic commits."""
        if not DB_URL:
            raise RuntimeError(
                "Database configuration context missing from environment variables."
            )

        with psycopg.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)

    @property
    def users(self) -> List[Dict[str, Any]]:
        """Fetch all client users dynamically from the database."""
        query = "SELECT id, username, email, pfp, is_active, last_online FROM users ORDER BY id ASC;"
        return self._execute_query(query)

    def get_user_by_id(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetch a single user profile from the database by their unique UUID."""
        query = "SELECT id, username, email, pfp, is_active, last_online FROM users WHERE id = %s;"

        return self._execute_query(query, (user_id,), fetch_all=False)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Fetch a single user profile from the database by their email"""
        query = "SELECT id, username, email, pfp, is_active, last_online FROM users WHERE email = %s;"

        return self._execute_query(query, (email,), fetch_all=False)

    def get_user_password_by_email(self, email: str) -> str | None:
        """Fetch a single user's hashed password string by their email address."""
        query = "SELECT hashed_password FROM users WHERE email = %s;"
        result = self._execute_query(query, (email,), fetch_all=False)

        if not result:
            return None

        return str(result["hashed_password"])

    def get_admin_by_id(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetch a single user profile from the database by their unique UUID."""
        query = "SELECT id, email FROM admin WHERE id = %s;"

        return self._execute_query(query, (user_id,), fetch_all=False)

    def get_admin_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Fetch a single admin profile from the database by their email"""
        query = "SELECT id, email, pfp FROM admin WHERE email = %s;"

        return self._execute_query(query, (email,), fetch_all=False)

    def get_admin_password_by_email(self, email: str) -> str | None:
        """Fetch a single admin's hashed password string by their email address."""
        query = "SELECT hashed_password FROM admin WHERE email = %s;"
        result = self._execute_query(query, (email,), fetch_all=False)

        if not result:
            return None

        return str(result["hashed_password"])

    def set_user_to_be_deleted_by_id(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Set a user to be deleted by setting the status to inactive"""
        query = "UPDATE users SET is_active = FALSE WHERE id = %s;"
        return self._execute_mutation(query, (user_id,))

    @property
    def admin_users(self) -> List[Dict[str, Any]]:
        """Fetch all administrative users dynamically from the database."""
        query = "SELECT email FROM admin ORDER BY id ASC;"
        return self._execute_query(query)

    @property
    def vendors(self) -> List[Dict[str, Any]]:
        """Fetch the active vendor list with resolved category names."""
        query = """
            SELECT
                v.id,
                v.name,
                v.category_id,
                v.location,
                v.data
            FROM vendors v
            INNER JOIN category c ON v.category_id = c.id
            ORDER BY v.id ASC;
        """
        return self._execute_query(query)

    @property
    def categories(self) -> List[Dict[str, Any]]:
        """Fetch the active vendor list data schema on demand."""
        query = "SELECT id, name FROM category;"
        return self._execute_query(query)

    @property
    def templates(self) -> List[Dict[str, Any]]:
        """Fetch accessible canvas baseline platform design blueprints."""
        query = "SELECT id, title, banner_url, data, flow FROM event_templates ORDER BY id ASC;"
        return self._execute_query(query)

    @property
    def events(self) -> List[Dict[str, Any]]:
        """Fetch all current aggregate user tracking events from live storage blocks."""
        query = "SELECT id, title, status, progress, image FROM events ORDER BY id ASC;"
        return self._execute_query(query)

    def get_event_by_id(self, event_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetch an event data from the database by id"""
        query = "SELECT id, user_id, title, banner_url, data, flow FROM events WHERE id = %s;"

        return self._execute_query(query, (event_id,), fetch_all=False)

    def get_template_by_id(self, template_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetch an event data from the database by id"""
        query = "SELECT id, title, banner_url, data, flow FROM event_templates WHERE id = %s;"

        return self._execute_query(query, (template_id,), fetch_all=False)

    def get_event_by_user_id(self, user_id: UUID) -> List[Dict[str, Any]]:
        """Fetch an event data from the database by id"""
        query = "SELECT id, user_id, title, banner_url, data, flow FROM events WHERE user_id = %s;"

        return self._execute_query(query, (user_id,))

    def update_event_state(
        self, event_id: Any, title: str, data: dict, flow: dict
    ) -> None:
        """Update a specific event's full tracking state inside PostgreSQL."""
        query = """
                UPDATE events
                SET title = %s, data = %s::jsonb, flow = %s::jsonb
                WHERE id = %s;
            """
        self._execute_mutation(
            query,
            (
                title,
                data,
                flow,
                str(event_id),
            ),
        )

    def update_user_status(self, user_id: int, is_active: bool) -> None:
        """Toggle a user's active access status flag."""
        query = "UPDATE users SET is_active = %s WHERE id = %s;"
        self._execute_mutation(query, (is_active, user_id))

    def delete_event_by_id(self, event_id: UUID) -> None:
        """Delete an event by it's ID"""
        query = "DELETE FROM events WHERE id = %s;"
        self._execute_mutation(query, (event_id,))

    def create_user(
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
            VALUES (%s, %s, %s, %s);
        """
        self._execute_mutation(query, (username, email, hashed_password, pfp))

    def update_user(
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

        # Dynamically build the SET clauses so we only touch what changed
        if username is not None:
            fields_to_update.append("username = %s")
            params.append(username)

        if email is not None:
            fields_to_update.append("email = %s")
            params.append(email)

        if hashed_password is not None:
            fields_to_update.append("hashed_password = %s")
            params.append(hashed_password)

        if pfp is not None:
            fields_to_update.append("pfp = %s")
            params.append(pfp)

        if is_active is not None:
            fields_to_update.append("is_active = %s")
            params.append(is_active)

        if not fields_to_update:
            return

        params.append(user_id)

        query = f"""
            UPDATE users
            SET {", ".join(fields_to_update)}
            WHERE id = %s;
        """

        self._execute_mutation(query, tuple(params))

    def create_event(
        self,
        title: str,
        banner_url: str | None,
        user_id: UUID,
        data: dict,  # 💡 Change from str to dict
        flow: dict | None,  # 💡 Change from str to dict
    ):
        """Onboard a brand new event instance into live storage."""
        query = """
                INSERT INTO events (title, banner_url, user_id, data, flow)
                VALUES (%s, %s, %s, %s::jsonb, %s::jsonb)
                RETURNING id;
            """
        result = self._execute_query(
            query, (title, banner_url, user_id, Json(data), Json(flow)), fetch_all=False
        )
        if not result:
            raise ValueError("Database failed to insert record and return ID.")
        return str(result["id"])

    def update_event(self, event_id: UUID, user_id: UUID, updates: dict):
        set_fields = []
        set_params = []

        json_columns = {"data": "data", "flow": "flow"}

        for key, value in updates.items():
            if key in json_columns and isinstance(value, dict):
                keys_to_delete = [
                    k
                    for k, v in value.items()
                    if v is None or (v == "") or (isinstance(v, (list, dict)) and not v)
                ]
                clean_updates = {
                    k: v
                    for k, v in value.items()
                    if v is not None and k not in keys_to_delete
                }

                sql_expr = json_columns[key]

                for dead_key in keys_to_delete:
                    sql_expr = f"({sql_expr} - %s)"
                    set_params.append(dead_key)

                if clean_updates:
                    sql_expr = f"{sql_expr} || %s::jsonb"
                    set_params.append(Json(clean_updates))

                set_fields.append(f"{json_columns[key]} = {sql_expr}")

            else:
                set_fields.append(f"{key} = %s")
                set_params.append(value)

        set_fields.append("updated_at = CURRENT_TIMESTAMP")

        where_params = [event_id, user_id]
        final_params = tuple(set_params + where_params)

        query = f"""
            UPDATE events
            SET {", ".join(set_fields)}
            WHERE id = %s AND user_id = %s
            RETURNING id, title, banner_url, data, flow;
        """

        return self._execute_query(query, final_params, fetch_all=False)

    def create_session(self, user_id: str, session_token: str, expires_at: str) -> None:
        """Onboard a brand new vendor instance into live storage."""
        query = """
            INSERT INTO sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, %s);
        """
        self._execute_mutation(query, (user_id, session_token, expires_at))

    def delete_session_by_token(self, session_token: str) -> None:
        """Purge an active session token row completely from storage upon logout."""
        query = "DELETE FROM sessions WHERE session_token = %s;"
        self._execute_mutation(query, (session_token,))

    def delete_expired_sessions(self) -> int:
        """Purge an active session token row completely from storage upon logout."""
        query = """
        WITH targeted_deletions AS (
            DELETE FROM sessions
            WHERE expires_at < CURRENT_TIMESTAMP
            RETURNING id
        )
        SELECT COUNT(*) AS deleted_count FROM targeted_deletions;
        """
        return self._execute_query(query, ())


db = DatabaseStore()
