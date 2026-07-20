from fastapi.testclient import TestClient

from app.main import LOG_STORE, app

client = TestClient(app)


def test_delete_logs_clears_store():
    LOG_STORE.clear()

    create_response = client.post(
        "/logs",
        json={
            "hostname": "demo-host",
            "application": "billing",
            "severity": "ERROR",
            "message": "Payment failed",
        },
    )
    assert create_response.status_code == 201

    delete_response = client.delete("/logs")
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "All logs deleted"
    assert client.get("/logs").json() == []
