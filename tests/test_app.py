import importlib
import os
import sys

from fastapi.testclient import TestClient
import pytest

# Ensure the `src` directory is importable so we can import `app` directly
ROOT = os.path.dirname(os.path.dirname(__file__))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

import app as app_module


@pytest.fixture
def client():
    importlib.reload(app_module)
    return TestClient(app_module.app)


def test_root_redirect(client):
    r = client.get("/", follow_redirects=False)
    assert r.status_code in (307, 308)
    assert r.headers["location"] == "/static/index.html"


def test_get_activities(client):
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_and_remove_participant(client):
    activity = "Chess Club"
    email = "tester@example.com"
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200
    assert "Signed up" in r.json().get("message", "")

    # Verify participant added
    r2 = client.get("/activities")
    assert email in r2.json()[activity]["participants"]

    # Remove participant
    r3 = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert r3.status_code == 200
    assert "Removed" in r3.json().get("message", "")

    r4 = client.get("/activities")
    assert email not in r4.json()[activity]["participants"]


def test_signup_duplicate(client):
    activity = "Programming Class"
    email = "dup@example.com"
    r1 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r1.status_code == 200
    r2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r2.status_code == 400


def test_activity_not_found(client):
    r = client.post("/activities/NoSuchActivity/signup", params={"email": "a@b.com"})
    assert r.status_code == 404


def test_remove_not_found(client):
    r = client.delete("/activities/Basketball/participants", params={"email": "not@there.com"})
    assert r.status_code == 404
