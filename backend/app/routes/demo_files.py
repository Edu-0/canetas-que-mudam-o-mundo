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


def _validar_arquivo_documento(file: UploadFile, nome_campo: str) -> bool:
    nome_arquivo = (file.filename or "").lower()
    extensao_valida = any(nome_arquivo.endswith(ext) for ext in EXTENSOES_DOCUMENTO_PERMITIDAS)
    mime_valido = (file.content_type or "").lower().startswith("image/")
    eh_pdf_mime = (file.content_type or "").lower() == "application/pdf"

    if not (mime_valido or eh_pdf_mime or extensao_valida):
        raise HTTPException(
            status_code=400,
            detail=(
                f"O arquivo '{nome_campo}' aceita apenas imagens ou PDF. "
                f"Recebido content_type='{file.content_type}' e filename='{file.filename}'."
            ),
        )

    return nome_arquivo.endswith(".pdf") or eh_pdf_mime


async def _processar_documento_ocr(
    file: UploadFile,
    campo_nome: str,
    is_pdf: bool,
) -> str:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail=f"{campo_nome} vazio.")

    return await run_in_threadpool(
        OcrDocumentoService.extrair_texto_bruto,
        file_bytes,
        is_pdf,
    )


@router.post("/ocr/comprovante-renda")
async def validar_comprovante_renda_ocr(
    comprovante_renda: UploadFile = File(...),
    nome_completo: str = Form(...),
    salario_beneficio: str = Form(...),
):
    eh_pdf_comprovante = _validar_arquivo_documento(comprovante_renda, "comprovante_renda")
    salario_beneficio_float = _parse_salario_beneficio(salario_beneficio)

    try:
        texto_comprovante = await _processar_documento_ocr(
            comprovante_renda,
            "Comprovante de renda",
            eh_pdf_comprovante,
        )

        dados_extraidos = OcrDocumentoService.extrair_dados_comprovante_renda(
            texto_comprovante,
            valor_referencia=salario_beneficio_float,
        )
        comparacao = OcrDocumentoService.comparar_com_cadastro(
            dados_extraidos={
                "nome_completo": dados_extraidos.get("nome_completo"),
                "salario_beneficio": dados_extraidos.get("salario_beneficio"),
            },
            nome_completo=nome_completo,
            cpf="",
            salario_beneficio=salario_beneficio_float,
        )
        comparacao["campos"].pop("cpf", None)
        comparacao["aprovado"] = bool(
            comparacao["campos"]["nome_completo"]["confere"]
            and comparacao["campos"]["salario_beneficio"]["confere"]
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Falha ao processar comprovante de renda no OCR: {exc}",
        ) from exc

    return {
        "dados_extraidos": {
            "nome_completo": dados_extraidos.get("nome_completo"),
            "salario_beneficio": dados_extraidos.get("salario_beneficio"),
        },
        "comparacao": comparacao,
        "texto_bruto": texto_comprovante,
    }


@router.post("/ocr/identidade")
async def validar_identidade_ocr(
    nome_completo: str = Form(...),
    cpf: str = Form(...),
    identidade: UploadFile = File(...),
):
    eh_pdf_identidade = _validar_arquivo_documento(identidade, "identidade")

    try:
        texto_identidade = await _processar_documento_ocr(
            identidade,
            "Documento de identidade",
            eh_pdf_identidade,
        )

        dados_extraidos = OcrDocumentoService.extrair_dados_identidade(texto_identidade)

        comparacao = OcrDocumentoService.comparar_com_cadastro(
            dados_extraidos=dados_extraidos,
            nome_completo=nome_completo,
            cpf=cpf,
            salario_beneficio=0.0,
        )
        comparacao["campos"].pop("salario_beneficio", None)
        comparacao["aprovado"] = bool(
            comparacao["campos"]["cpf"]["confere"]
            and comparacao["campos"]["nome_completo"]["confere"]
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Falha ao processar identidade no OCR: {exc}",
        ) from exc

    return {
        "dados_extraidos": dados_extraidos,
        "comparacao": comparacao,
        "texto_bruto": {
            "identidade": dados_extraidos.get("texto_bruto", ""),
        },
    }


@router.post("/validar-documento-ocr")
async def validar_documento_ocr(
    comprovante_renda: UploadFile = File(...),
    identidade: UploadFile = File(...),
    nome_completo: str = Form(...),
    cpf: str = Form(...),
    salario_beneficio: str = Form(...),
):
    comprovante_result = await validar_comprovante_renda_ocr(
        comprovante_renda=comprovante_renda,
        nome_completo=nome_completo,
        salario_beneficio=salario_beneficio,
    )
    identidade_result = await validar_identidade_ocr(
        nome_completo=nome_completo,
        cpf=cpf,
        identidade=identidade,
    )

    return {
        "comprovante_renda": comprovante_result,
        "identidade": identidade_result,
        "aprovado": bool(
            comprovante_result["comparacao"]["aprovado"]
            and identidade_result["comparacao"]["aprovado"]
        ),
    }


@router.delete("/delete")
def delete(file_url: str):
    FirebaseStorageService.delete_file(file_url)

    return {"message": "Arquivo removido"}