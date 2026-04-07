import firebase_admin
from firebase_admin import credentials, storage
import os

FIREBASE_CREDENTIALS_PATH = os.getenv(
    "FIREBASE_CREDENTIALS",
    "app/credentials/firebase/firebase-service-account.json"
)

FIREBASE_BUCKET = os.getenv(
    "FIREBASE_STORAGE_BUCKET",
    "SEU_BUCKET_AQUI.appspot.com"
)


def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)

        firebase_admin.initialize_app(cred, {
            "storageBucket": FIREBASE_BUCKET
        })


def get_bucket():
    init_firebase()
    return storage.bucket()