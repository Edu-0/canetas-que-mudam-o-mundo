from fastapi import APIRouter, UploadFile, File
from app.services.firebase_storage import FirebaseStorageService

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload")
def upload(file: UploadFile = File(...)):
    url = FirebaseStorageService.upload_file(file)

    return {
        "url": url
    }

@router.delete("/delete")
def delete(file_url: str):
    FirebaseStorageService.delete_file(file_url)

    return {"message": "Arquivo removido"}