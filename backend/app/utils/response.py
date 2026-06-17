from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


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


def success(
    data: Any | None = None, message: str = "OK", status_code: int = 200
) -> JSONResponse:
    if data is not None:
        data = jsonable_encoder(data)
    return JSONResponse(
        status_code=status_code,
        content={"success": True, "message": message, "data": data},
    )


def error(message: str, status_code: int = 400, data: Any = None):
    raise CustomException(message=message, status_code=status_code, data=data)
