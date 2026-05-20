from datetime import datetime, timedelta

from fastapi import HTTPException, status
from fastapi_mail import MessageSchema, MessageType
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.enums import StatusDoacao, StatusPedidoMaterial, TipoUsuario
from app.models.doacao import Doacao, ItemDoacao
from app.models.estoque import ItemEstoque
from app.models.ong import Ong
from app.models.pedido_material import ItemPedidoMaterial, PedidoMaterial
from app.models.reserva_estoque import ReservaEstoque
from app.models.movimento_estoque import MovimentoEstoque
from app.models.user import FamiliaResponsavel, Usuario, UsuarioResponsavel
from app.schemas.pedido_material import CriarPedidoMaterial
from app.utils.funcoes import gerar_codigo_numerico
from doacao_service import sincronizar_status_doacao


PRAZO_MAXIMO_RETIRADA_DIAS = 7


def usuario_tem_funcao(usuario: Usuario, tipo_usuario: TipoUsuario) -> bool:
    return any(funcao.tipo_usuario == tipo_usuario for funcao in usuario.funcao)


def validar_usuario_responsavel(usuario: Usuario) -> None:
    if not usuario_tem_funcao(usuario, TipoUsuario.RESPONSAVEL_BENEFICIARIO):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Responsáveis pelo beneficiário podem solicitar materiais.",
        )


def validar_usuario_ong(usuario: Usuario) -> int:
    if usuario_tem_funcao(usuario, TipoUsuario.TRIAGEM):
        if not usuario.vinculo_voluntario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voluntário da triagem não possui vínculo com ONG.",
            )
        return usuario.vinculo_voluntario.ong_id

    if usuario_tem_funcao(usuario, TipoUsuario.COORDENADOR_PROCESSOS):
        if not usuario.ong:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Coordenador não possui ONG vinculada.",
            )
        return usuario.ong.id

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Apenas usuários da ONG podem aprovar ou confirmar pedidos.",
    )


def _carregar_pedido_com_relacoes(db: Session, pedido_id: int) -> PedidoMaterial:
    pedido = (
        db.query(PedidoMaterial)
        .options(
            selectinload(PedidoMaterial.itens),
            selectinload(PedidoMaterial.responsavel),
            selectinload(PedidoMaterial.familiar),
            selectinload(PedidoMaterial.ong),
        )
        .filter(PedidoMaterial.id == pedido_id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido de material não encontrado.")
    return pedido


def _carregar_item_com_relacoes(db: Session, item_id: int) -> ItemPedidoMaterial:
    item = (
        db.query(ItemPedidoMaterial)
        .options(
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.itens),
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.responsavel),
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.ong),
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.familiar),
        )
        .filter(ItemPedidoMaterial.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item do pedido não encontrado.")
    return item


def listar_materiais_disponiveis(db: Session, ong_id: int) -> list[dict[str, int | str]]:
    consulta = (
        db.query(
            ItemDoacao.tipo_material.label("tipo_material"),
            func.sum(ItemDoacao.quantidade).label("quantidade_disponivel"),
        )
        .join(ItemEstoque, ItemEstoque.item_doacao_id == ItemDoacao.id)
        .join(Doacao, Doacao.id == ItemDoacao.doacao_id)
        .filter(
            Doacao.ong_id == ong_id,
            ItemDoacao.status == StatusDoacao.DISPONIVEL,
            ItemEstoque.retirado_em.is_(None),
        )
        .group_by(ItemDoacao.tipo_material)
        .order_by(ItemDoacao.tipo_material.asc())
    )

    return [
        {
            "tipo_material": tipo_material,
            "quantidade_disponivel": int(quantidade_disponivel or 0),
        }
        for tipo_material, quantidade_disponivel in consulta.all()
    ]


def _quantidade_total_ativa_por_familiar(db: Session, familiar_id: int) -> int:
    quantidade_ativa = (
        db.query(func.coalesce(func.sum(ItemPedidoMaterial.quantidade), 0))
        .join(PedidoMaterial, PedidoMaterial.id == ItemPedidoMaterial.pedido_material_id)
        .filter(
            PedidoMaterial.familiar_id == familiar_id,
            ItemPedidoMaterial.status.in_(
                [
                    StatusPedidoMaterial.AGUARDANDO_APROVACAO,
                    StatusPedidoMaterial.AGUARDANDO_RETIRADA,
                ]
            ),
        )
        .scalar()
    )
    return int(quantidade_ativa or 0)


def _obter_familiar_do_responsavel(
    db: Session,
    usuario: Usuario,
    familiar_id: int,
) -> FamiliaResponsavel:
    familiar = (
        db.query(FamiliaResponsavel)
        .join(UsuarioResponsavel, UsuarioResponsavel.id == FamiliaResponsavel.responsavel_id)
        .filter(
            FamiliaResponsavel.id == familiar_id,
            UsuarioResponsavel.responsavel_id == usuario.id,
            FamiliaResponsavel.beneficiario.is_(True),
            FamiliaResponsavel.ativo.is_(True),
        )
        .first()
    )

    if not familiar:
        raise HTTPException(
            status_code=404,
            detail="Familiar beneficiário não encontrado para este responsável.",
        )

    return familiar


def criar_pedido_material(db: Session, usuario: Usuario, dados: CriarPedidoMaterial) -> PedidoMaterial:
    validar_usuario_responsavel(usuario)

    ong = db.get(Ong, dados.ong_id)
    if not ong:
        raise HTTPException(status_code=404, detail="ONG não encontrada.")

    familiar = _obter_familiar_do_responsavel(db, usuario, dados.familiar_id)

    materiais_disponiveis = {
        item["tipo_material"]: item["quantidade_disponivel"]
        for item in listar_materiais_disponiveis(db, dados.ong_id)
    }

    total_pedido = sum(item.quantidade for item in dados.itens)
    if total_pedido > 20:
        raise HTTPException(
            status_code=400,
            detail="O pedido não pode ultrapassar 20 materiais por beneficiário.",
        )

    total_ativo = _quantidade_total_ativa_por_familiar(db, dados.familiar_id)
    if total_ativo + total_pedido > 20:
        raise HTTPException(
            status_code=400,
            detail="O total de materiais solicitados para este beneficiário não pode ultrapassar 20.",
        )

    pedido = PedidoMaterial(
        responsavel_id=usuario.id,
        familiar_id=familiar.id,
        ong_id=dados.ong_id,
        status=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
    )

    for item_dados in dados.itens:
        quantidade_disponivel = materiais_disponiveis.get(item_dados.tipo_material)
        if quantidade_disponivel is None:
            raise HTTPException(
                status_code=400,
                detail=f"O material '{item_dados.tipo_material}' não está disponível na ONG selecionada.",
            )
        if item_dados.quantidade > quantidade_disponivel:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Quantidade solicitada de '{item_dados.tipo_material}' maior que o disponível na ONG."
                ),
            )

        pedido.itens.append(
            ItemPedidoMaterial(
                tipo_material=item_dados.tipo_material,
                quantidade=item_dados.quantidade,
                status=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
            )
        )

    try:
        db.add(pedido)
        db.commit()
        db.refresh(pedido)
        return pedido
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao cadastrar pedido de material: {str(exc)}",
        ) from exc


def listar_pedidos(
    db: Session,
    usuario: Usuario,
    status_pedido: StatusPedidoMaterial | None = None,
    ordem: str = "desc",
) -> list[PedidoMaterial]:
    ordem_normalizada = ordem.strip().lower()
    if ordem_normalizada in {"asc", "crescente", "antigas", "mais_antigas"}:
        ordenacao = (PedidoMaterial.created_at.asc(), PedidoMaterial.id.asc())
    elif ordem_normalizada in {"desc", "decrescente", "recentes", "mais_recentes"}:
        ordenacao = (PedidoMaterial.created_at.desc(), PedidoMaterial.id.desc())
    else:
        raise HTTPException(
            status_code=400,
            detail="Ordem inválida. Use asc ou desc.",
        )

    query = db.query(PedidoMaterial).options(
        selectinload(PedidoMaterial.itens),
        selectinload(PedidoMaterial.responsavel),
        selectinload(PedidoMaterial.familiar),
        selectinload(PedidoMaterial.ong),
    )

    if usuario_tem_funcao(usuario, TipoUsuario.RESPONSAVEL_BENEFICIARIO):
        query = query.filter(PedidoMaterial.responsavel_id == usuario.id)
    else:
        ong_id = validar_usuario_ong(usuario)
        query = query.filter(PedidoMaterial.ong_id == ong_id)

    if status_pedido is not None:
        query = query.filter(PedidoMaterial.status == status_pedido)

    return query.order_by(*ordenacao).all()


def aprovar_item_pedido_material(
    db: Session,
    usuario: Usuario,
    item_id: int,
) -> ItemPedidoMaterial:
    ong_id = validar_usuario_ong(usuario)
    item = _carregar_item_com_relacoes(db, item_id)

    if item.pedido.ong_id != ong_id:
        raise HTTPException(
            status_code=403,
            detail="Pedido não pertence à ONG do usuário atual.",
        )

    if item.status != StatusPedidoMaterial.AGUARDANDO_APROVACAO:
        raise HTTPException(
            status_code=400,
            detail="Apenas itens aguardando aprovação podem ser aprovados.",
        )

    agora = datetime.now()
    if not item.pedido.codigo_coleta:
        item.pedido.codigo_coleta = gerar_codigo_numerico(
            f"pedido:{item.pedido.id}:codigo_coleta",
            8,
        )

    item.status = StatusPedidoMaterial.AGUARDANDO_RETIRADA
    item.aprovado_em = agora
    item.pedido.status = StatusPedidoMaterial.AGUARDANDO_RETIRADA
    item.pedido.prazo_retirada_limite = item.pedido.prazo_retirada_limite or (
        agora + timedelta(days=PRAZO_MAXIMO_RETIRADA_DIAS)
    )
    item.pedido.notificacao_aprovacao_enviada_em = agora
    # Reservar estoque para este item do pedido (evita overbooking)
    quantidade_necessaria = item.quantidade
    if quantidade_necessaria > 0:
        itens_doacao_disponiveis = (
            db.query(ItemDoacao)
            .join(ItemEstoque, ItemEstoque.item_doacao_id == ItemDoacao.id)
            .join(Doacao, Doacao.id == ItemDoacao.doacao_id)
            .filter(
                Doacao.ong_id == item.pedido.ong_id,
                ItemDoacao.tipo_material == item.tipo_material,
                ItemDoacao.status == StatusDoacao.DISPONIVEL,
            )
            .filter(ItemEstoque.retirado_em.is_(None))
            .order_by(ItemDoacao.disponivel_em.asc())
            .all()
        )

        restante = quantidade_necessaria
        reservas: list[ReservaEstoque] = []
        for item_doacao in itens_doacao_disponiveis:
            if restante <= 0:
                break

            disponivel = int(item_doacao.quantidade or 0)
            if disponivel <= 0:
                continue

            if disponivel <= restante:
                reservado = disponivel
                restante -= disponivel
                # consumir todo o item_doacao (reservado)
                item_doacao.status = StatusDoacao.MATERIAL_COLETADO
                item_doacao.coletado_em = agora
                if item_doacao.estoque is not None:
                    item_doacao.estoque.retirado_em = agora
            else:
                reservado = restante
                # consumir parcialmente: reduzir quantidade disponível
                item_doacao.quantidade = disponivel - restante
                restante = 0

            reserva = ReservaEstoque(
                item_pedido_material_id=item.id,
                item_doacao_id=item_doacao.id,
                quantidade=reservado,
                reservado_em=agora,
            )
            reservas.append(reserva)

        # registrar movimentos de reserva
        for reservado in reservas:
            mov = MovimentoEstoque(
                tipo="RESERVA",
                item_pedido_material_id=item.id,
                item_doacao_id=reservado.item_doacao_id,
                quantidade=reservado.quantidade,
                usuario_id=usuario.id,
            )
            db.add(mov)

        if restante > 0:
            db.rollback()
            raise HTTPException(status_code=400, detail="Estoque insuficiente para aprovar este item do pedido.")

        for r in reservas:
            db.add(r)

    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao aprovar pedido de material: {str(exc)}",
        ) from exc


def coletar_item_pedido_material(
    db: Session,
    usuario: Usuario,
    item_id: int,
) -> ItemPedidoMaterial:
    ong_id = validar_usuario_ong(usuario)
    item = _carregar_item_com_relacoes(db, item_id)

    if item.pedido.ong_id != ong_id:
        raise HTTPException(
            status_code=403,
            detail="Pedido não pertence à ONG do usuário atual.",
        )

    if item.status != StatusPedidoMaterial.AGUARDANDO_RETIRADA:
        raise HTTPException(
            status_code=400,
            detail="Só é possível coletar um item que esteja AGUARDANDO_RETIRADA.",
        )

    agora = datetime.now()
    item.status = StatusPedidoMaterial.MATERIAL_COLETADO
    item.coletado_em = agora

    if all(
        item_pedido.status == StatusPedidoMaterial.MATERIAL_COLETADO
        for item_pedido in item.pedido.itens
    ):
        item.pedido.status = StatusPedidoMaterial.MATERIAL_COLETADO

    # Alocar / subtrair do estoque: consumir ItemDoacao DISPONIVEL do mesmo tipo
    quantidade_necessaria = item.quantidade
    if quantidade_necessaria > 0:
        itens_doacao_disponiveis = (
            db.query(ItemDoacao)
            .join(ItemEstoque, ItemEstoque.item_doacao_id == ItemDoacao.id)
            .join(Doacao, Doacao.id == ItemDoacao.doacao_id)
            .filter(
                Doacao.ong_id == item.pedido.ong_id,
                ItemDoacao.tipo_material == item.tipo_material,
                ItemDoacao.status == StatusDoacao.DISPONIVEL,
            )
            .filter(ItemEstoque.retirado_em.is_(None))
            .order_by(ItemDoacao.disponivel_em.asc())
            .all()
        )

        # Preferir consumo a partir de reservas existentes
        reservas_pendentes = (
            db.query(ReservaEstoque)
            .filter(ReservaEstoque.item_pedido_material_id == item.id)
            .filter(ReservaEstoque.consumido_em.is_(None))
            .order_by(ReservaEstoque.reservado_em.asc())
            .all()
        )

        restante = quantidade_necessaria
        consumidos_ids = set()
        # consumir a partir das reservas
        for reserva in reservas_pendentes:
            if restante <= 0:
                break
            disponivel_reserva = int(reserva.quantidade or 0)
            if disponivel_reserva <= 0:
                continue
            usar = min(disponivel_reserva, restante)

            # registrar movimento de consumo parcial/total
            mov = MovimentoEstoque(
                tipo="CONSUMO",
                item_pedido_material_id=item.id,
                item_doacao_id=reserva.item_doacao_id,
                quantidade=usar,
                usuario_id=usuario.id,
            )
            db.add(mov)

            if usar >= disponivel_reserva:
                # consumo total da reserva
                reserva.consumido_em = agora
                reserva.consumido_por_id = usuario.id
            else:
                # consumo parcial da reserva -> reduzir quantidade reservada
                reserva.quantidade = disponivel_reserva - usar

            restante -= usar
            consumidos_ids.add(reserva.item_doacao_id)
            # marcar item_doacao/estoque
            item_doacao = db.get(ItemDoacao, reserva.item_doacao_id)
            if item_doacao:
                if usar >= int(item_doacao.quantidade or 0):
                    item_doacao.status = StatusDoacao.MATERIAL_COLETADO
                    item_doacao.coletado_em = agora
                    if item_doacao.estoque is not None:
                        item_doacao.estoque.retirado_em = agora
                else:
                    item_doacao.quantidade = int(item_doacao.quantidade or 0) - usar

        # se ainda faltar, consumir diretamente do estoque disponível (fallback)
        if restante > 0:
            itens_doacao_disponiveis = (
                db.query(ItemDoacao)
                .join(ItemEstoque, ItemEstoque.item_doacao_id == ItemDoacao.id)
                .join(Doacao, Doacao.id == ItemDoacao.doacao_id)
                .filter(
                    Doacao.ong_id == item.pedido.ong_id,
                    ItemDoacao.tipo_material == item.tipo_material,
                    ItemDoacao.status == StatusDoacao.DISPONIVEL,
                )
                .filter(ItemEstoque.retirado_em.is_(None))
                .order_by(ItemDoacao.disponivel_em.asc())
                .all()
            )

            for item_doacao in itens_doacao_disponiveis:
                if restante <= 0:
                    break
                disponivel = int(item_doacao.quantidade or 0)
                if disponivel <= 0:
                    continue
                usar = min(disponivel, restante)
                if usar >= disponivel:
                    item_doacao.status = StatusDoacao.MATERIAL_COLETADO
                    item_doacao.coletado_em = agora
                    if item_doacao.estoque is not None:
                        item_doacao.estoque.retirado_em = agora
                else:
                    item_doacao.quantidade = disponivel - usar

                mov = MovimentoEstoque(
                    tipo="CONSUMO",
                    item_pedido_material_id=item.id,
                    item_doacao_id=item_doacao.id,
                    quantidade=usar,
                    usuario_id=usuario.id,
                )
                db.add(mov)
                restante -= usar
                consumidos_ids.add(item_doacao.id)

        if restante > 0:
            db.rollback()
            raise HTTPException(status_code=400, detail="Estoque insuficiente para coletar este item do pedido.")

        # sincronizar status das doações afetadas
        # pegar todos item_doacao envolvidos (reservas + fallback)
        for item_doacao_id in consumidos_ids:
            item_doacao = db.get(ItemDoacao, item_doacao_id)
            if item_doacao:
                sincronizar_status_doacao(item_doacao.doacao)


def cancelar_item_pedido_material(
    db: Session,
    usuario: Usuario,
    item_id: int,
) -> ItemPedidoMaterial:
    ong_id = validar_usuario_ong(usuario)
    item = _carregar_item_com_relacoes(db, item_id)

    if item.pedido.ong_id != ong_id:
        raise HTTPException(
            status_code=403,
            detail="Pedido não pertence à ONG do usuário atual.",
        )

    if item.status != StatusPedidoMaterial.AGUARDANDO_RETIRADA:
        raise HTTPException(
            status_code=400,
            detail="Apenas itens que estejam AGUARDANDO_RETIRADA podem ser cancelados.",
        )

    # liberar reservas associadas
    reservas = (
        db.query(ReservaEstoque)
        .filter(ReservaEstoque.item_pedido_material_id == item.id)
        .all()
    )

    for reserva in reservas:
        item_doacao = db.get(ItemDoacao, reserva.item_doacao_id)
        if not item_doacao:
            continue

        # devolver quantidade reservada
        item_doacao.quantidade = int(item_doacao.quantidade or 0) + int(reserva.quantidade or 0)

        # marcar disponível caso tivesse sido marcado como MATERIAL_COLETADO durante reserva
        if item_doacao.status == StatusDoacao.MATERIAL_COLETADO:
            item_doacao.status = StatusDoacao.DISPONIVEL
            item_doacao.coletado_em = None

        if item_doacao.estoque is not None and item_doacao.estoque.retirado_em is not None:
            item_doacao.estoque.retirado_em = None

        sincronizar_status_doacao(item_doacao.doacao)
        # registrar movimento de liberação (histórico)
        mov = MovimentoEstoque(
            tipo="LIBERACAO",
            item_pedido_material_id=item.id,
            item_doacao_id=reserva.item_doacao_id,
            quantidade=reserva.quantidade,
            usuario_id=usuario.id,
            detalhe="Liberação de reserva por cancelamento de pedido",
        )
        db.add(mov)
        db.delete(reserva)

    item.status = StatusPedidoMaterial.CANCELADO

    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao cancelar item do pedido: {str(exc)}",
        ) from exc


def listar_movimentos_pedido(db: Session, usuario: Usuario, pedido_id: int) -> list[MovimentoEstoque]:
    pedido = db.get(PedidoMaterial, pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

    # autorização: responsáveis veem apenas seus pedidos; ONG vê pedidos da ONG
    if usuario_tem_funcao(usuario, TipoUsuario.RESPONSAVEL_BENEFICIARIO):
        if pedido.responsavel_id != usuario.id:
            raise HTTPException(status_code=403, detail="Acesso negado ao histórico deste pedido.")
    else:
        ong_id = validar_usuario_ong(usuario)
        if pedido.ong_id != ong_id:
            raise HTTPException(status_code=403, detail="Acesso negado ao histórico deste pedido.")

    item_ids = [it.id for it in pedido.itens]

    movimentos = (
        db.query(MovimentoEstoque)
        .filter(MovimentoEstoque.item_pedido_material_id.in_(item_ids))
        .order_by(MovimentoEstoque.created_at.asc())
        .all()
    )

    return movimentos

    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao registrar coleta do pedido: {str(exc)}",
        ) from exc


def montar_email_aprovacao_item(item: ItemPedidoMaterial) -> MessageSchema:
    pedido = item.pedido
    ong = pedido.ong
    endereco = ", ".join(
        str(parte)
        for parte in [
            ong.rua,
            ong.numero,
            ong.complemento,
            ong.bairro,
            ong.cidade,
            ong.estado,
            ong.cep,
        ]
        if parte
    )
    dias = ", ".join(str(dia) for dia in ong.dias_funcionamento)
    prazo = (
        pedido.prazo_retirada_limite.strftime("%d/%m/%Y %H:%M")
        if pedido.prazo_retirada_limite
        else ""
    )
    corpo = (
        f"Olá, {pedido.responsavel.nome_completo}.<br><br>"
        "Seu pedido de material foi aprovado e está aguardando retirada.<br><br>"
        f"<strong>ONG:</strong> {ong.nome}<br>"
        f"<strong>Endereço:</strong> {endereco}<br>"
        f"<strong>Dias de funcionamento:</strong> {dias}<br>"
        f"<strong>Horário:</strong> {ong.hora_abertura} às {ong.hora_fechamento}<br>"
        f"<strong>Prazo máximo para retirada:</strong> {prazo}<br>"
        f"<strong>Código de autorização:</strong> {pedido.codigo_coleta}<br><br>"
        f"<strong>Material:</strong> {item.tipo_material}<br>"
        f"<strong>Quantidade:</strong> {item.quantidade}"
    )

    return MessageSchema(
        subject="Pedido de material aprovado",
        recipients=[pedido.responsavel.email],
        body=corpo,
        subtype=MessageType.html,
    )


def montar_email_material_disponivel(item: ItemPedidoMaterial) -> MessageSchema:
    pedido = item.pedido
    ong = pedido.ong
    endereco = ", ".join(
        str(parte)
        for parte in [
            ong.rua,
            ong.numero,
            ong.complemento,
            ong.bairro,
            ong.cidade,
            ong.estado,
            ong.cep,
        ]
        if parte
    )
    corpo = (
        f"Olá, {pedido.responsavel.nome_completo}.<br><br>"
        "O material solicitado agora está disponível para retirada na ONG.<br><br>"
        f"<strong>ONG:</strong> {ong.nome}<br>"
        f"<strong>Endereço:</strong> {endereco}<br>"
        f"<strong>Material:</strong> {item.tipo_material}<br>"
        f"<strong>Quantidade:</strong> {item.quantidade}<br>"
        f"<strong>Código de autorização:</strong> {pedido.codigo_coleta or '-'}"
    )

    return MessageSchema(
        subject="Material disponível para retirada",
        recipients=[pedido.responsavel.email],
        body=corpo,
        subtype=MessageType.html,
    )


def registrar_notificacoes_material_disponivel(db: Session, item_doacao: ItemDoacao) -> list[MessageSchema]:
    itens_pedido = (
        db.query(ItemPedidoMaterial)
        .join(PedidoMaterial, PedidoMaterial.id == ItemPedidoMaterial.pedido_material_id)
        .options(
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.responsavel),
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.ong),
            selectinload(ItemPedidoMaterial.pedido).selectinload(PedidoMaterial.familiar),
        )
        .filter(
            PedidoMaterial.ong_id == item_doacao.doacao.ong_id,
            ItemPedidoMaterial.tipo_material == item_doacao.tipo_material,
            ItemPedidoMaterial.status.in_(
                [
                    StatusPedidoMaterial.AGUARDANDO_APROVACAO,
                    StatusPedidoMaterial.AGUARDANDO_RETIRADA,
                ]
            ),
            ItemPedidoMaterial.notificado_disponivel_em.is_(None),
        )
        .all()
    )

    agora = datetime.now()
    mensagens: list[MessageSchema] = []
    for item_pedido in itens_pedido:
        item_pedido.notificado_disponivel_em = agora
        mensagens.append(montar_email_material_disponivel(item_pedido))

    if itens_pedido:
        db.commit()

    return mensagens
