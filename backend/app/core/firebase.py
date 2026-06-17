import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, storage

BASE_DIR = Path(__file__).resolve().parents[2]

FIREBASE_CREDENTIALS_PATH = os.getenv(
    "FIREBASE_CREDENTIALS",
    "app/credentials/firebase/firebase-service-account.json"
)

if not Path(FIREBASE_CREDENTIALS_PATH).is_absolute():
    FIREBASE_CREDENTIALS_PATH = str(BASE_DIR / FIREBASE_CREDENTIALS_PATH)

FIREBASE_BUCKET = os.getenv(
    "FIREBASE_STORAGE_BUCKET",
    "SEU_BUCKET_AQUI.appspot.com"
)


def init_firebase():
    if firebase_admin._apps:
        return

    if not os.path.isfile(FIREBASE_CREDENTIALS_PATH):
        raise RuntimeError(
            "Arquivo de credenciais do Firebase não encontrado: "
            f"{FIREBASE_CREDENTIALS_PATH}"
        )

    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        "storageBucket": FIREBASE_BUCKET
    })


def get_bucket():
    init_firebase()
    return storage.bucket()