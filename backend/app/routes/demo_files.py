import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from app.database.connection import SessionDep
from app.models.user import AuditoriaAprovacao, Usuario, UsuarioResponsavel
from app.core.enums import BeneficiosUsuario, StatusBeneficiario
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


def _parse_float_form(valor: str, nome_campo: str) -> float:
    try:
        return _parse_salario_beneficio(valor)
    except HTTPException as exc:
        raise HTTPException(
            status_code=422,
            detail=f"{nome_campo} inválido. Use formato 2468,02 ou 2468.02.",
        ) from exc


def _registrar_auditoria(
    db: SessionDep,
    *,
    usuario_id: int,
    entidade: str,
    acao: str,
    resultado: str,
    ip_origem: str,
    detalhes: dict,
) -> None:
    log = AuditoriaAprovacao(
        usuario_id=usuario_id,
        entidade=entidade,
        acao=acao,
        resultado=resultado,
        ip_origem=ip_origem,
        detalhes=json.dumps(detalhes, ensure_ascii=False),
    )
    db.add(log)
    db.commit()


def _atualizar_status_beneficiario(db: SessionDep, usuario_id: int, aprovado: bool) -> dict:
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    perfil = db.query(UsuarioResponsavel).filter(UsuarioResponsavel.usuario_id == usuario_id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil de responsável beneficiário não encontrado.")

    perfil.documentacao_aprovada = aprovado
    perfil.status = StatusBeneficiario.ATIVO if aprovado else StatusBeneficiario.REPROVADO

    if aprovado:
        usuario.ativo = True

    db.add(perfil)
    db.add(usuario)
    db.commit()
    db.refresh(perfil)

    return {
        "usuario_id": usuario_id,
        "documentacao_aprovada": perfil.documentacao_aprovada,
        "status": perfil.status.value,
    }


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


@router.post("/ocr/avaliar-elegibilidade")
async def avaliar_elegibilidade_beneficiario(
    request: Request,
    db: SessionDep,
    comprovante_renda: UploadFile = File(...),
    nome_completo: str = Form(...),
    usuario_id: int = Form(...),
    declarou_auxilio: bool = Form(False),
    auxilio_declarado: BeneficiosUsuario = Form(BeneficiosUsuario.NENHUM),
    renda_declarada: str = Form("0"),
    salario_minimo: str = Form(...),
    limite_salarios_minimos: str = Form("1"),
    qtd_familiares: int = Form(1),
    considerar_per_capita: bool = Form(True),
):
    eh_pdf_comprovante = _validar_arquivo_documento(comprovante_renda, "comprovante_renda")

    salario_minimo_float = _parse_float_form(salario_minimo, "salario_minimo")
    limite_salarios_float = _parse_float_form(limite_salarios_minimos, "limite_salarios_minimos")
    renda_declarada_float = _parse_float_form(renda_declarada, "renda_declarada")

    try:
        texto_comprovante = await _processar_documento_ocr(
            comprovante_renda,
            "Comprovante de renda",
            eh_pdf_comprovante,
        )

        dados_extraidos = OcrDocumentoService.extrair_dados_comprovante_renda(
            texto_comprovante,
            valor_referencia=renda_declarada_float if renda_declarada_float > 0 else None,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Falha ao processar comprovante de renda no OCR: {exc}",
        ) from exc

    renda_documento = dados_extraidos.get("salario_beneficio")
    if renda_documento is None:
        raise HTTPException(
            status_code=422,
            detail="Não foi possível identificar um valor de renda no documento.",
        )

    termos_auxilio = OcrDocumentoService.detectar_termos_auxilio(texto_comprovante)
    regra_auxilio = len(termos_auxilio) > 0

    regra_renda = OcrDocumentoService.avaliar_regra_renda(
        renda_documento=float(renda_documento),
        salario_minimo=salario_minimo_float,
        limite_salarios_minimos=limite_salarios_float,
        qtd_familiares=qtd_familiares,
        considerar_per_capita=considerar_per_capita,
    )

    declarou_renda = renda_declarada_float > 0
    aprovado_automatico_auxilio = bool(declarou_auxilio and regra_auxilio)
    aprovado_por_renda = bool(declarou_renda and regra_renda["aprovado"])
    aprovado = aprovado_automatico_auxilio or aprovado_por_renda

    status_beneficiario = _atualizar_status_beneficiario(db, usuario_id=usuario_id, aprovado=aprovado)

    criterio_aplicado = (
        "auxilio_comprovado" if aprovado_automatico_auxilio
        else "renda_limite" if aprovado_por_renda
        else "reprovado"
    )

    detalhes_auditoria = {
        "nome_completo": nome_completo,
        "declara_auxilio": declarou_auxilio,
        "declara_renda": declarou_renda,
        "auxilio_declarado": auxilio_declarado.value,
        "termos_auxilio_encontrados": termos_auxilio,
        "renda_declarada": round(renda_declarada_float, 2),
        "regra_renda": regra_renda,
        "criterio_aplicado": criterio_aplicado,
    }

    _registrar_auditoria(
        db,
        usuario_id=usuario_id,
        entidade="documento",
        acao="aprovacao_documentacao_beneficiario",
        resultado="aprovado" if aprovado else "reprovado",
        ip_origem=request.client.host if request.client else "0.0.0.0",
        detalhes=detalhes_auditoria,
    )

    return {
        "aprovado": aprovado,
        "criterio_aplicado": criterio_aplicado,
        "status_beneficiario": status_beneficiario,
        "regras": {
            "regra_1_renda": regra_renda,
            "regra_2_termos_auxilio": {
                "aprovado": regra_auxilio,
                "termos_encontrados": termos_auxilio,
            },
            "aprovado_automatico_auxilio": aprovado_automatico_auxilio,
        },
        "dados_extraidos": {
            "nome_completo": dados_extraidos.get("nome_completo"),
            "renda_lida_documento": renda_documento,
        },
        "texto_bruto": texto_comprovante,
    }


@router.post("/triagem/materiais/{usuario_id}/decisao")
def registrar_decisao_materiais(
    usuario_id: int,
    request: Request,
    db: SessionDep,
    aprovado: bool = Form(...),
    observacao: str = Form(""),
):
    _registrar_auditoria(
        db,
        usuario_id=usuario_id,
        entidade="material",
        acao="aprovacao_materiais",
        resultado="aprovado" if aprovado else "reprovado",
        ip_origem=request.client.host if request.client else "0.0.0.0",
        detalhes={"observacao": observacao.strip()},
    )

    return {
        "usuario_id": usuario_id,
        "entidade": "material",
        "resultado": "aprovado" if aprovado else "reprovado",
    }


@router.delete("/delete")
def delete(file_url: str):
    FirebaseStorageService.delete_file(file_url)

    return {"message": "Arquivo removido"}