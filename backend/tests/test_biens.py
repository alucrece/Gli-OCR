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

def test_create_bien_authenticated(client):
    token = get_auth_token(client)
    response = client.post("/biens/", json={
        "adresse": "12 rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "surface": 45.0,
        "loyer_mensuel": 1200.0,
        "charges_mensuelles": 150.0
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    data = response.json()
    assert data["adresse"] == "12 rue de la Paix"
    assert data["ville"] == "Paris"
    assert data["loyer_mensuel"] == 1200.0

def test_create_bien_unauthenticated(client):
    response = client.post("/biens/", json={
        "adresse": "12 rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "surface": 45.0,
        "loyer_mensuel": 1200.0,
        "charges_mensuelles": 150.0
    })
    assert response.status_code == 401

def test_get_biens_empty(client):
    token = get_auth_token(client)
    response = client.get("/biens/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == []

def test_get_biens_after_creation(client):
    token = get_auth_token(client)
    client.post("/biens/", json={
        "adresse": "12 rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "surface": 45.0,
        "loyer_mensuel": 1200.0,
        "charges_mensuelles": 150.0
    }, headers={"Authorization": f"Bearer {token}"})
    response = client.get("/biens/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_delete_bien(client):
    token = get_auth_token(client)
    create = client.post("/biens/", json={
        "adresse": "12 rue de la Paix",
        "ville": "Paris",
        "code_postal": "75001",
        "surface": 45.0,
        "loyer_mensuel": 1200.0,
        "charges_mensuelles": 150.0
    }, headers={"Authorization": f"Bearer {token}"})
    bien_id = create.json()["id"]
    response = client.delete(f"/biens/{bien_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 204

def test_get_bien_not_found(client):
    token = get_auth_token(client)
    response = client.get("/biens/999", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404