def get_auth_token(client):
    """Helper pour récupérer un token JWT"""
    client.post("/auth/register", json={
        "email": "owner@test.com",
        "password": "motdepasse123",
        "nom": "Owner",
        "prenom": "Test"
    })
    response = client.post("/auth/login", data={
        "username": "owner@test.com",
        "password": "motdepasse123"
    })
    return response.json()["access_token"]

def test_get_dashboard_empty(client):
    token = get_auth_token(client)
    response = client.get("/dashboard/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["nb_biens"] == 0
    assert data["nb_locataires_actifs"] == 0
    assert data["loyers_mensuels_total"] == 0.0
    assert data["charges_mensuelles_total"] == 0.0
    assert data["revenu_net_mensuel"] == 0.0
    assert data["biens"] == []

def test_get_dashboard_with_bien(client):
    token = get_auth_token(client)
    client.post("/biens/", json={
        "adresse": "12 rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "surface": 45.0,
        "loyer_mensuel": 1200.0,
        "charges_mensuelles": 150.0
    }, headers={"Authorization": f"Bearer {token}"})
    response = client.get("/dashboard/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["nb_biens"] == 1
    assert data["loyers_mensuels_total"] == 1200.0
    assert data["charges_mensuelles_total"] == 150.0
    assert data["revenu_net_mensuel"] == 1050.0

def test_get_dashboard_unauthenticated(client):
    response = client.get("/dashboard/")
    assert response.status_code == 401