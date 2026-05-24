from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from fastapi_mail import FastMail

from app.core.config_email import conf
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.core.enums import StatusPedidoMaterial
from app.database.connection import SessionDep
from app.models.user import Usuario
from app.schemas import pedido_material as s
from app.services import pedido_material_service as service
from app.schemas import movimento_estoque as ms


router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.get("/materiais-disponiveis", response_model=list[s.RespostaOpcaoMaterial])
def listar_materiais_disponiveis(
    db: SessionDep,
    ong_id: int = Query(...),
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("pedido:listar")),
):
    return service.listar_materiais_disponiveis(db=db, ong_id=ong_id)


@router.post("/", response_model=s.RespostaPedidoMaterial, status_code=status.HTTP_201_CREATED)
def criar_pedido(
    dados: s.CriarPedidoMaterial,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("pedido:criar")),
):
    return service.criar_pedido_material(db=db, usuario=usuario_atual, dados=dados)


@router.get("/", response_model=list[s.RespostaPedidoMaterial])
def listar_pedidos(
    db: SessionDep,
    status_pedido: StatusPedidoMaterial | None = Query(default=None, alias="status"),
    ordem: str = Query(default="desc"),
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("pedido:listar")),
):
    return service.listar_pedidos(
        db=db,
        usuario=usuario_atual,
        status_pedido=status_pedido,
        ordem=ordem,
    )


@router.patch("/itens/{item_id}/status", response_model=s.RespostaItemPedidoMaterial)
def alterar_status_item_pedido(
    item_id: int,
    dados: s.AtualizarStatusPedidoMaterial,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("pedido:alterar_status")),
):
    if dados.status == StatusPedidoMaterial.AGUARDANDO_RETIRADA:
        item = service.aprovar_item_pedido_material(db=db, usuario=usuario_atual, item_id=item_id)
        background_tasks.add_task(FastMail(conf).send_message, service.montar_email_aprovacao_item(item))
        return item

    if dados.status == StatusPedidoMaterial.MATERIAL_COLETADO:
        return service.coletar_item_pedido_material(db=db, usuario=usuario_atual, item_id=item_id)

    if dados.status == StatusPedidoMaterial.CANCELADO:
        return service.cancelar_item_pedido_material(db=db, usuario=usuario_atual, item_id=item_id)

    raise HTTPException(
        status_code=400,
        detail="Apenas os status AGUARDANDO_RETIRADA, MATERIAL_COLETADO e CANCELADO podem ser aplicados em pedidos.",
    )


@router.get("/{pedido_id}/historico", response_model=list[ms.MovimentoEstoqueResposta])
def historico_pedido(
    pedido_id: int,
    db: SessionDep,
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("pedido:listar")),
):
    return service.listar_movimentos_pedido(db=db, usuario=usuario_atual, pedido_id=pedido_id)
