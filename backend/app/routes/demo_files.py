from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from starlette.concurrency import run_in_threadpool
from app.services.firebase_storage import FirebaseStorageService
from app.services.ocr_documento import OcrDocumentoService

router = APIRouter(prefix="/files", tags=["files"])

EXTENSOES_IMAGEM_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
EXTENSOES_DOCUMENTO_PERMITIDAS = EXTENSOES_IMAGEM_PERMITIDAS | {".pdf"}


def _parse_salario_beneficio(valor: str) -> float:
    valor_limpo = (valor or "").strip()
    if "," in valor_limpo:
        # Formato BR: 2.468,02 -> 2468.02
        valor_normalizado = valor_limpo.replace(".", "").replace(",", ".")
    else:
        # Formato padrão: 2468.02
        valor_normalizado = valor_limpo
    try:
        return float(valor_normalizado)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail="salario_beneficio inválido. Use formato 2468,02 ou 2468.02.",
        ) from exc


@router.post("/upload")
def upload(file: UploadFile = File(...)):
    url = FirebaseStorageService.upload_file(file)

    return {
        "url": url
    }


@router.post("/validar-documento-ocr")
async def validar_documento_ocr(
    file: UploadFile = File(...),
    nome_completo: str = Form(...),
    cpf: str = Form(...),
    salario_beneficio: str = Form(...),
):
    nome_arquivo = (file.filename or "").lower()
    extensao_valida = any(nome_arquivo.endswith(ext) for ext in EXTENSOES_DOCUMENTO_PERMITIDAS)
    eh_pdf_ext = nome_arquivo.endswith(".pdf")
    mime_valido = (file.content_type or "").lower().startswith("image/")
    eh_pdf_mime = (file.content_type or "").lower() == "application/pdf"

    if not (mime_valido or eh_pdf_mime or extensao_valida):
        raise HTTPException(
            status_code=400,
            detail=(
                "O endpoint de OCR aceita apenas arquivos de imagem ou PDF. "
                f"Recebido content_type='{file.content_type}' e filename='{file.filename}'."
            ),
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    salario_beneficio_float = _parse_salario_beneficio(salario_beneficio)

    try:
        eh_pdf = eh_pdf_mime or eh_pdf_ext
        texto_bruto = await run_in_threadpool(
            OcrDocumentoService.extrair_texto_bruto,
            file_bytes,
            eh_pdf,
        )
        dados_extraidos = OcrDocumentoService.extrair_dados_chave(texto_bruto)
        comparacao = OcrDocumentoService.comparar_com_cadastro(
            dados_extraidos=dados_extraidos,
            nome_completo=nome_completo,
            cpf=cpf,
            salario_beneficio=salario_beneficio_float,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Falha ao processar imagem no OCR: {exc}",
        ) from exc

    return {
        "dados_extraidos": {
            "cpf": dados_extraidos.get("cpf"),
            "nome_completo": dados_extraidos.get("nome_completo"),
            "salario_beneficio": dados_extraidos.get("salario_beneficio"),
        },
        "comparacao": comparacao,
        "texto_bruto": dados_extraidos.get("texto_bruto", ""),
    }

@router.delete("/delete")
def delete(file_url: str):
    FirebaseStorageService.delete_file(file_url)

    return {"message": "Arquivo removido"}