import pytest
from fastapi.testclient import TestClient

from app.database import database as db_module
from app.main import app


@pytest.fixture
def client():
    db_module.db = db_module._seed()
    with TestClient(app) as c:
        yield c
