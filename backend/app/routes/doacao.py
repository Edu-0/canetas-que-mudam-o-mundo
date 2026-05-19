import json
from datetime import date
from typing import List

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi_mail import FastMail, MessageSchema, MessageType
from pydantic import ValidationError

from app.core.config_email import conf
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.core.enums import StatusDoacao, ResultadoTriagemDoacao
from app.database.connection import SessionDep
from app.models import doacao as m
from app.models.user import Usuario
from app.schemas import doacao as s
from app.services import doacao_service as service
from app.services import pedido_material_service as pedido_service
from app.services.firebase_storage import FirebaseStorageService


router = APIRouter(prefix="/doacoes", tags=["doacoes"])


async def _validar_tamanho_upload(file: UploadFile) -> int:
    conteudo = await file.read()
    tamanho = len(conteudo)
    await file.seek(0)

    if tamanho > m.MAX_TAMANHO_FOTO_DOACAO_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"A foto {file.filename} excede o limite de 10MB.",
        )

    if tamanho == 0:
        raise HTTPException(
            status_code=400,
            detail=f"A foto {file.filename} está vazia.",
        )

    return tamanho


def _parse_itens_formulario(itens: str) -> list[s.CriarItemDoacaoFormulario]:
    try:
        dados = json.loads(itens)
        if not isinstance(dados, list):
            raise ValueError("O campo itens deve ser uma lista JSON.")
        return [s.CriarItemDoacaoFormulario.model_validate(item) for item in dados]
    except (json.JSONDecodeError, ValidationError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Campo itens inválido: {str(exc)}",
        ) from exc


def _montar_email_pre_aprovacao(doacao: m.Doacao) -> MessageSchema:
    endereco = service.montar_endereco_ong(doacao.ong)
    dias = ", ".join(str(dia) for dia in doacao.ong.dias_funcionamento)
    corpo = (
        f"Olá, {doacao.doador.nome_completo}.<br><br>"
        "Sua doação possui material pré-aprovado pela triagem.<br>"
        "Leve o material até a ONG escolhida para conferência física.<br><br>"
        f"<strong>ONG:</strong> {doacao.ong.nome}<br>"
        f"<strong>Endereço:</strong> {endereco}<br>"
        f"<strong>Dias de funcionamento:</strong> {dias}<br>"
        f"<strong>Horário:</strong> {doacao.ong.hora_abertura} às {doacao.ong.hora_fechamento}<br><br>"
        "O material só entrará como disponível após o recebimento físico pela triagem."
    )

    return MessageSchema(
        subject="Doação pré-aprovada para entrega",
        recipients=[doacao.doador.email],
        body=corpo,
        subtype=MessageType.html,
    )


@router.post("/", response_model=s.RespostaDoacao, status_code=status.HTTP_201_CREATED)
def criar_doacao(
    dados: s.CriarDoacao,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao:criar")),
):
    return service.criar_doacao(db=db, doador=usuario_atual, dados=dados)


@router.post("/formulario", response_model=s.RespostaDoacao, status_code=status.HTTP_201_CREATED)
async def criar_doacao_formulario(
    db: SessionDep,
    ong_id: int = Form(...),
    itens: str = Form(...),
    observacao_doador: str | None = Form(default=None),
    fotos: List[UploadFile] = File(...),
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao:criar")),
):
    itens_formulario = _parse_itens_formulario(itens)

    if not fotos:
        raise HTTPException(status_code=400, detail="Ao menos uma foto deve ser enviada.")

    fotos_por_indice = {}
    urls_enviadas = []

    try:
        for indice, foto in enumerate(fotos):
            tamanho = await _validar_tamanho_upload(foto)
            url = FirebaseStorageService.upload_file(foto, folder="doacoes")
            urls_enviadas.append(url)
            fotos_por_indice[indice] = s.CriarFotoItemDoacao(
                url=url,
                nome_original=foto.filename,
                content_type=foto.content_type or "application/octet-stream",
                tamanho_bytes=tamanho,
            )

        itens_create = []
        for item in itens_formulario:
            fotos_item = []
            for indice_foto in item.fotos_indices:
                if indice_foto not in fotos_por_indice:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Índice de foto inválido para item: {indice_foto}.",
                    )
                fotos_item.append(fotos_por_indice[indice_foto])

            itens_create.append(
                s.CriarItemDoacao(
                    tipo_material=item.tipo_material,
                    descricao=item.descricao,
                    possiveis_defeitos=item.possiveis_defeitos,
                    quantidade=item.quantidade,
                    fotos=fotos_item,
                )
            )

        dados = s.CriarDoacao(
            ong_id=ong_id,
            observacao_doador=observacao_doador,
            itens=itens_create,
        )
        return service.criar_doacao(db=db, doador=usuario_atual, dados=dados)

    except Exception:
        for url in urls_enviadas:
            try:
                FirebaseStorageService.delete_file(url)
            except Exception:
                pass
        raise


@router.get("/", response_model=list[s.RespostaListagemDoacao])
def listar_doacoes(
    db: SessionDep,
    data_inicio: date | None = Query(default=None),
    data_final: date | None = Query(default=None),
    status_doacao: StatusDoacao | None = Query(default=None, alias="status"),
    ordem: str = Query(default="desc"),
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao:listar")),
):
    return service.listar_doacoes(
        db=db,
        usuario_atual=usuario_atual,
        data_inicio=data_inicio,
        data_final=data_final,
        status_doacao=status_doacao,
        ordem=ordem,
    )


@router.get("/{doacao_id}", response_model=s.RespostaDoacao)
def obter_doacao(
    doacao_id: int,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
):
    doacao = db.get(m.Doacao, doacao_id)
    if not doacao:
        raise HTTPException(status_code=404, detail="Doação não encontrada.")

    if doacao.doador_id != usuario_atual.id:
        service.validar_voluntario_triagem(usuario_atual, doacao.ong_id)

    return doacao


@router.post("/itens/{item_doacao_id}/avaliacoes", response_model=s.RespostaAvaliacaoTriagemDoacao)
def avaliar_item_doacao(
    item_doacao_id: int,
    dados: s.CriarAvaliacaoTriagemDoacao,
    db: SessionDep,
    background_tasks: BackgroundTasks,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao_item:avaliar")),
):
    avaliacao = service.avaliar_item_doacao(
        db=db,
        voluntario=usuario_atual,
        item_doacao_id=item_doacao_id,
        dados=dados,
    )

    # Envia e-mail automático ao doador quando item for pré-aprovado
    if avaliacao.resultado == ResultadoTriagemDoacao.PRE_APROVADO:
        item = db.get(m.ItemDoacao, item_doacao_id)
        if item and item.doacao:
            fm = FastMail(conf)
            background_tasks.add_task(fm.send_message, _montar_email_pre_aprovacao(item.doacao))

    return avaliacao


@router.patch("/itens/{item_doacao_id}/status", response_model=s.RespostaItemDoacao)
def alterar_status_item_doacao(
    item_doacao_id: int,
    dados: s.AtualizarStatusItemDoacao,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao_item:alterar_status")),
):
    item = service.alterar_status_item_doacao(
        db=db,
        usuario_atual=usuario_atual,
        item_doacao_id=item_doacao_id,
        dados=dados,
    )

    if item.status == StatusDoacao.DISPONIVEL:
        mensagens = pedido_service.registrar_notificacoes_material_disponivel(db=db, item_doacao=item)
        fm = FastMail(conf)
        for mensagem in mensagens:
            background_tasks.add_task(fm.send_message, mensagem)

    return item


@router.post("/{doacao_id}/notificar-pre-aprovacao", response_model=s.RespostaNotificacaoDoacao)
def notificar_pre_aprovacao(
    doacao_id: int,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao:notificar_status")),
):
    doacao = service.registrar_notificacao_pre_aprovacao(
        db=db,
        usuario_atual=usuario_atual,
        doacao_id=doacao_id,
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, _montar_email_pre_aprovacao(doacao))

    return s.RespostaNotificacaoDoacao(
        doacao_id=doacao.id,
        email_status_enviado_em=doacao.email_status_enviado_em,
        destinatario=doacao.doador.email,
        endereco_ong=service.montar_endereco_ong(doacao.ong),
        dias_funcionamento=doacao.ong.dias_funcionamento,
        hora_abertura=str(doacao.ong.hora_abertura),
        hora_fechamento=str(doacao.ong.hora_fechamento),
    )
