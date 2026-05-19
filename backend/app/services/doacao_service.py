from datetime import date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.enums import ResultadoTriagemDoacao, StatusDoacao, TipoUsuario
from app.models.doacao import (
    AvaliacaoTriagemDoacao,
    Doacao,
    FotoItemDoacao,
    ItemDoacao,
)
from app.models.estoque import ItemEstoque
from app.models.ong import Ong
from app.models.user import Usuario
from app.schemas.doacao import (
    AtualizarStatusItemDoacao,
    CriarAvaliacaoTriagemDoacao,
    CriarDoacao,
)


STATUS_LISTAGEM_TRIAGEM = {
    StatusDoacao.AGUARDANDO_TRIAGEM,
    StatusDoacao.AGUARDANDO_NOVA_TRIAGEM,
}


def usuario_tem_funcao(usuario: Usuario, tipo_usuario: TipoUsuario) -> bool:
    return any(funcao.tipo_usuario == tipo_usuario for funcao in usuario.funcao)


def validar_usuario_doador(usuario: Usuario) -> None:
    if not usuario_tem_funcao(usuario, TipoUsuario.DOADOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários com perfil Doador podem criar doações.",
        )


def validar_voluntario_triagem(usuario: Usuario, ong_id: int) -> None:
    if not usuario_tem_funcao(usuario, TipoUsuario.TRIAGEM):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Voluntários da Triagem podem realizar esta operação.",
        )

    if not usuario.vinculo_voluntario or usuario.vinculo_voluntario.ong_id != ong_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voluntário não pertence à ONG vinculada a esta doação.",
        )


def obter_item_doacao(db: Session, item_doacao_id: int) -> ItemDoacao:
    item = db.get(ItemDoacao, item_doacao_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item de doação não encontrado.")
    return item


def sincronizar_status_doacao(doacao: Doacao) -> None:
    statuses = {item.status for item in doacao.itens}

    if not statuses:
        return

    if len(statuses) == 1:
        doacao.status = next(iter(statuses))
        return

    if StatusDoacao.DISPONIVEL in statuses:
        doacao.status = StatusDoacao.DISPONIVEL
    elif StatusDoacao.PRE_APROVADO in statuses:
        doacao.status = StatusDoacao.PRE_APROVADO
    elif StatusDoacao.AGUARDANDO_TRIAGEM in statuses:
        doacao.status = StatusDoacao.AGUARDANDO_TRIAGEM
    elif StatusDoacao.AGUARDANDO_NOVA_TRIAGEM in statuses:
        doacao.status = StatusDoacao.AGUARDANDO_NOVA_TRIAGEM
    elif StatusDoacao.MATERIAL_COLETADO in statuses:
        doacao.status = StatusDoacao.MATERIAL_COLETADO
    elif StatusDoacao.INAPTO in statuses:
        doacao.status = StatusDoacao.INAPTO
    else:
        doacao.status = StatusDoacao.CANCELADO


def sincronizar_item_estoque(db: Session, item: ItemDoacao, agora: datetime) -> None:
    if item.status == StatusDoacao.DISPONIVEL:
        if item.estoque is None:
            item.estoque = ItemEstoque(item_doacao_id=item.id, disponivel_em=agora)
        else:
            item.estoque.disponivel_em = agora
        item.estoque.retirado_em = None
        return

    if item.status == StatusDoacao.MATERIAL_COLETADO and item.estoque is not None:
        item.estoque.retirado_em = agora


def criar_doacao(db: Session, doador: Usuario, dados: CriarDoacao) -> Doacao:
    validar_usuario_doador(doador)

    ong = db.get(Ong, dados.ong_id)
    if not ong:
        raise HTTPException(status_code=404, detail="ONG não encontrada.")

    doacao = Doacao(
        doador_id=doador.id,
        ong_id=dados.ong_id,
        status=StatusDoacao.AGUARDANDO_TRIAGEM,
        observacao_doador=dados.observacao_doador,
    )

    for item_dados in dados.itens:
        item = ItemDoacao(
            tipo_material=item_dados.tipo_material,
            descricao=item_dados.descricao,
            possiveis_defeitos=item_dados.possiveis_defeitos,
            quantidade=item_dados.quantidade,
            status=StatusDoacao.AGUARDANDO_TRIAGEM,
        )

        for foto_dados in item_dados.fotos:
            item.fotos.append(
                FotoItemDoacao(
                    url=foto_dados.url,
                    nome_original=foto_dados.nome_original,
                    content_type=foto_dados.content_type,
                    tamanho_bytes=foto_dados.tamanho_bytes,
                    checksum=foto_dados.checksum,
                )
            )

        doacao.itens.append(item)

    try:
        db.add(doacao)
        db.commit()
        db.refresh(doacao)
        return doacao
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao cadastrar doação: {str(exc)}",
        ) from exc


def listar_doacoes(
    db: Session,
    usuario_atual: Usuario,
    data_inicio: date | None = None,
    data_final: date | None = None,
    status_doacao: StatusDoacao | None = None,
    ordem: str = "desc",
) -> list[Doacao]:
    if data_inicio and data_final and data_inicio > data_final:
        raise HTTPException(
            status_code=400,
            detail="Data inicial não pode ser maior que a data final.",
        )

    # Ajuste de comportamento de listagem:
    # - Se foi passado um status específico, permite filtrar por ele para os usuários
    #   autorizados (Doador, Triagem ou Coordenador).
    # - Se não foi passado status, por padrão Voluntário da Triagem e
    #   Coordenador de Processos recebem apenas itens aguardando triagem,
    #   enquanto Doadores recebem todas as suas doações sem filtro de status.
    

    ordem_normalizada = ordem.strip().lower()
    ordens_ascendentes = {"asc", "crescente", "antigas", "mais_antigas"}
    ordens_descendentes = {"desc", "decrescente", "recentes", "mais_recentes"}

    if ordem_normalizada in ordens_ascendentes:
        ordenacao = (Doacao.created_at.asc(), Doacao.id.asc())
    elif ordem_normalizada in ordens_descendentes:
        ordenacao = (Doacao.created_at.desc(), Doacao.id.desc())
    else:
        raise HTTPException(
            status_code=400,
            detail="Ordem inválida. Use asc, desc, crescente, decrescente, antigas ou recentes.",
        )

    query = db.query(Doacao).options(
        selectinload(Doacao.itens).selectinload(ItemDoacao.fotos),
    )

    if usuario_tem_funcao(usuario_atual, TipoUsuario.TRIAGEM):
        if not usuario_atual.vinculo_voluntario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voluntário da triagem não possui vínculo com ONG.",
            )
        query = query.filter(Doacao.ong_id == usuario_atual.vinculo_voluntario.ong_id)
    elif usuario_tem_funcao(usuario_atual, TipoUsuario.COORDENADOR_PROCESSOS):
        if not usuario_atual.ong:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Coordenador não possui ONG vinculada.",
            )
        query = query.filter(Doacao.ong_id == usuario_atual.ong.id)
    elif usuario_tem_funcao(usuario_atual, TipoUsuario.DOADOR):
        query = query.filter(Doacao.doador_id == usuario_atual.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Doador, Voluntário da Triagem ou Coordenador de Processos podem listar doações.",
        )

    if status_doacao:
        status_permitidos = [status_doacao]
    else:
        if usuario_tem_funcao(usuario_atual, TipoUsuario.TRIAGEM) or usuario_tem_funcao(
            usuario_atual, TipoUsuario.COORDENADOR_PROCESSOS
        ):
            status_permitidos = list(STATUS_LISTAGEM_TRIAGEM)
        else:
            status_permitidos = None
    
    if status_permitidos:
        query = query.filter(Doacao.status.in_(status_permitidos))
    

    if data_inicio:
        query = query.filter(Doacao.created_at >= datetime.combine(data_inicio, time.min))

    if data_final:
        query = query.filter(Doacao.created_at <= datetime.combine(data_final, time.max))

    return query.order_by(*ordenacao).all()


def avaliar_item_doacao(
    db: Session,
    voluntario: Usuario,
    item_doacao_id: int,
    dados: CriarAvaliacaoTriagemDoacao,
) -> AvaliacaoTriagemDoacao:
    item = obter_item_doacao(db, item_doacao_id)
    validar_voluntario_triagem(voluntario, item.doacao.ong_id)

    if item.status != StatusDoacao.AGUARDANDO_TRIAGEM:
        raise HTTPException(
            status_code=400,
            detail="Apenas itens aguardando triagem podem ser avaliados.",
        )

    if dados.resultado == ResultadoTriagemDoacao.INAPTO and not dados.motivo_inaptidao:
        raise HTTPException(
            status_code=400,
            detail="O motivo de inaptidão é obrigatório ao marcar um item como INAPTO.",
        )

    agora = datetime.now()
    avaliacao = AvaliacaoTriagemDoacao(
        item_doacao_id=item.id,
        voluntario_triagem_id=voluntario.id,
        resultado=dados.resultado,
        checklist=dados.checklist,
        comentario=dados.comentario,
        motivo_inaptidao=dados.motivo_inaptidao,
        em_quarentena=dados.em_quarentena,
    )

    item.triado_por_id = voluntario.id
    item.triado_em = agora

    if dados.resultado == ResultadoTriagemDoacao.PRE_APROVADO:
        item.status = StatusDoacao.PRE_APROVADO
        item.pre_aprovado_em = agora
        item.motivo_inaptidao = None
    else:
        item.status = StatusDoacao.INAPTO
        item.motivo_inaptidao = dados.motivo_inaptidao

    sincronizar_status_doacao(item.doacao)

    try:
        db.add(avaliacao)
        db.commit()
        db.refresh(avaliacao)
        return avaliacao
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao registrar avaliação de triagem: {str(exc)}",
        ) from exc


def alterar_status_item_doacao(
    db: Session,
    usuario_atual: Usuario,
    item_doacao_id: int,
    dados: AtualizarStatusItemDoacao,
) -> ItemDoacao:
    item = obter_item_doacao(db, item_doacao_id)
    novo_status = dados.status
    agora = datetime.now()

    if novo_status == StatusDoacao.DISPONIVEL:
        validar_voluntario_triagem(usuario_atual, item.doacao.ong_id)
        if item.status == StatusDoacao.AGUARDANDO_TRIAGEM:
            raise HTTPException(
                status_code=400,
                detail="Não é permitido alterar diretamente de AGUARDANDO_TRIAGEM para DISPONIVEL.",
            )
        if item.status != StatusDoacao.PRE_APROVADO:
            raise HTTPException(
                status_code=400,
                detail="Só é possível disponibilizar item PRE_APROVADO.",
            )

        item.status = StatusDoacao.DISPONIVEL
        item.recebido_por_id = usuario_atual.id
        item.recebido_em = agora
        item.disponivel_em = agora
        sincronizar_item_estoque(db, item, agora)

    elif novo_status == StatusDoacao.MATERIAL_COLETADO:
        if not (
            usuario_tem_funcao(usuario_atual, TipoUsuario.RESPONSAVEL_BENEFICIARIO)
            or usuario_tem_funcao(usuario_atual, TipoUsuario.TRIAGEM)
        ):
            raise HTTPException(
                status_code=403,
                detail="Apenas Responsável pelo Beneficiário ou Triagem podem registrar coleta.",
            )
        if item.status != StatusDoacao.DISPONIVEL:
            raise HTTPException(
                status_code=400,
                detail="Só é possível coletar material que esteja DISPONIVEL.",
            )

        item.status = StatusDoacao.MATERIAL_COLETADO
        item.coletado_por_id = usuario_atual.id
        item.coletado_em = agora
        sincronizar_item_estoque(db, item, agora)

    elif novo_status == StatusDoacao.INAPTO:
        validar_voluntario_triagem(usuario_atual, item.doacao.ong_id)
        if not dados.motivo_inaptidao:
            raise HTTPException(
                status_code=400,
                detail="O motivo de inaptidão é obrigatório ao marcar um item como INAPTO.",
            )
        if item.status == StatusDoacao.MATERIAL_COLETADO:
            raise HTTPException(
                status_code=400,
                detail="Material coletado não pode ser marcado como INAPTO.",
            )

        item.status = StatusDoacao.INAPTO
        item.motivo_inaptidao = dados.motivo_inaptidao
        item.triado_por_id = usuario_atual.id
        item.triado_em = item.triado_em or agora

    elif novo_status == StatusDoacao.CANCELADO:
        if usuario_atual.id != item.doacao.doador_id and not usuario_tem_funcao(usuario_atual, TipoUsuario.TRIAGEM):
            raise HTTPException(
                status_code=403,
                detail="Apenas o Doador da doação ou Triagem podem cancelar o item.",
            )
        if item.status == StatusDoacao.MATERIAL_COLETADO:
            raise HTTPException(
                status_code=400,
                detail="Material coletado não pode ser cancelado.",
            )
        item.status = StatusDoacao.CANCELADO

    else:
        raise HTTPException(
            status_code=400,
            detail="Use a avaliação de triagem para PRE_APROVADO/INAPTO ou o recebimento físico para DISPONIVEL.",
        )

    sincronizar_status_doacao(item.doacao)

    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao alterar status do item: {str(exc)}",
        ) from exc


def registrar_notificacao_pre_aprovacao(
    db: Session,
    usuario_atual: Usuario,
    doacao_id: int,
) -> Doacao:
    doacao = db.get(Doacao, doacao_id)
    if not doacao:
        raise HTTPException(status_code=404, detail="Doação não encontrada.")

    validar_voluntario_triagem(usuario_atual, doacao.ong_id)

    if not any(item.status == StatusDoacao.PRE_APROVADO for item in doacao.itens):
        raise HTTPException(
            status_code=400,
            detail="A doação precisa ter ao menos um item PRE_APROVADO para notificação.",
        )

    doacao.email_status_enviado_em = datetime.now()

    try:
        db.commit()
        db.refresh(doacao)
        return doacao
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao registrar notificação de status: {str(exc)}",
        ) from exc


def montar_endereco_ong(ong: Ong) -> str:
    partes = [
        ong.rua,
        ong.numero,
        ong.complemento,
        ong.bairro,
        ong.cidade,
        ong.estado,
        ong.cep,
    ]
    return ", ".join(str(parte) for parte in partes if parte)
