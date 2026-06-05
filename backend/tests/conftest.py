import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import db as db_module


@pytest.fixture
def client():
    db_module.db = db_module._seed()
    with TestClient(app) as c:
        yield c
