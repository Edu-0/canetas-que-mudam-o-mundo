from app.core.firebase import get_bucket
from fastapi import UploadFile
import uuid


class FirebaseStorageService:

    @staticmethod
    def upload_file(file: UploadFile, folder: str = "uploads") -> str:
        bucket = get_bucket()

        extension = file.filename.split(".")[-1]
        filename = f"{folder}/{uuid.uuid4()}.{extension}"

        blob = bucket.blob(filename)

        blob.upload_from_file(
            file.file,
            content_type=file.content_type
        )

        blob.make_public()

        return blob.public_url

    @staticmethod
    def delete_file(file_url: str):
        bucket = get_bucket()

        bucket_name = bucket.name
        path = file_url.split(f"/{bucket_name}/")[-1]

        blob = bucket.blob(path)
        blob.delete()

    @staticmethod
    def upload_bytes(file_bytes: bytes, filename: str, content_type: str):
        bucket = get_bucket()

        blob = bucket.blob(filename)

        blob.upload_from_string(
            file_bytes,
            content_type=content_type
        )

        blob.make_public()

        return blob.public_url