from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from psycopg import OperationalError


class CustomException(Exception):
    def __init__(self, message: str, status_code: int = 400, data: Any = None):
        self.message = message
        self.status_code = status_code
        self.data = data


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(CustomException)
    async def custom_api_exception_handler(request: Request, exc: CustomException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.message, "data": exc.data},
        )

    @app.exception_handler(OperationalError)
    async def database_disconnect_exception_handler(
        request: Request, exc: OperationalError
    ):
        print(f"CRITICAL DB ERROR: {exc}")

        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "Failed to connect to DB",
                "data": None,
            },
        )


def success(
    data: Any = None, message: str = "OK", status_code: int = 200
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": True, "message": message, "data": data},
    )


def error(message: str, status_code: int = 400, data: Any = None):
    raise CustomException(message=message, status_code=status_code, data=data)
