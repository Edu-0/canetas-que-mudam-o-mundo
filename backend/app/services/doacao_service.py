from datetime import date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload,joinedload

from app.core.enums import ResultadoTriagemDoacao, StatusDoacao, TipoUsuario
from app.models.doacao import (
    AvaliacaoTriagemDoacao,
    Doacao,
    FotoItemDoacao,
    ItemDoacao
)
from app.models.ong import Ong, VoluntarioOng
from app.models.estoque import ItemEstoque
from app.models.ong import Ong
from app.models.user import Usuario, UsuarioFuncao
from app.schemas.doacao import (
    AtualizarStatusItemDoacao,
    CriarAvaliacaoTriagemDoacao,
    CriarDoacao,
    RespostaRevisarAvaliacaoTriagem,
    RespostaAvaliacaoTriagemDoacao,
    RespostaListagemQuarentena
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

def validar_usuario_coordenador(usuario:Usuario, ong_id) -> None:
    if not usuario_tem_funcao(usuario, TipoUsuario.COORDENADOR_PROCESSOS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários com perfil Coordenador de Processos podem avaliar análises.",
        )

    if not usuario.ong or usuario.ong.id != ong_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Coordenador não gerencia a ONG vinculada a esta análise.",
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

def obter_analise_material(db: Session, analise_id: int) -> AvaliacaoTriagemDoacao:
    analise = db.query(AvaliacaoTriagemDoacao).filter(AvaliacaoTriagemDoacao.id == analise_id).first()
    if not analise:
        raise HTTPException(status_code=404, detail="Análise de doação não encontrado.")
    return analise
 
def obter_vinculo_voluntario(db:Session, voluntario_id:int, ong_id:int) -> VoluntarioOng:
    vinculo_voluntario = db.query(VoluntarioOng).filter(
        VoluntarioOng.usuario_id == voluntario_id,
        VoluntarioOng.ong_id == ong_id).first()
    if not vinculo_voluntario:
        raise HTTPException(status_code=404, detail="Vínculo de voluntário não encontrado.")
    return vinculo_voluntario

def obter_ong_coordenador(db:Session, usuario):
    ong = db.query(Ong).filter(Ong.id == usuario.ong.id).first()
    if not ong:
        raise HTTPException(status_code=404, detail="ONG não encontrada.")
    return ong

def obter_ong_vinculada(db: Session, usuario_atual: Usuario):
    tipos_atuais_objs = db.query(UsuarioFuncao).filter(UsuarioFuncao.usuario_id == usuario_atual.id).all()
    tipos_atuais = [f.tipo_usuario for f in tipos_atuais_objs]
    
    if TipoUsuario.COORDENADOR_PROCESSOS in tipos_atuais:
        return obter_ong(db, usuario_atual)
        
    elif TipoUsuario.TRIAGEM in tipos_atuais:
        vinculo = obter_vinculo_voluntario(db, usuario_atual.id)
        if vinculo: 
            return db.query(Ong).filter(Ong.id == vinculo.ong_id).first()
            
    return None
   

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


def listar_historico_avaliacoes_voluntario(
    db: Session, 
    voluntario_id: int 
):
    analises = db.query(AvaliacaoTriagemDoacao)\
            .filter(
            AvaliacaoTriagemDoacao.voluntario_triagem_id == voluntario_id 
        ).all()
    return analises

def listar_analises_quarentena(db: Session, ong_id: int):
    
    analises = db.query(AvaliacaoTriagemDoacao)\
        .join(ItemDoacao, AvaliacaoTriagemDoacao.item_doacao_id == ItemDoacao.id)\
        .join(Doacao, ItemDoacao.doacao_id == Doacao.id)\
        .options(
            joinedload(AvaliacaoTriagemDoacao.voluntario_triagem).joinedload(Usuario.vinculo_voluntario),            
            joinedload(AvaliacaoTriagemDoacao.item_doacao).joinedload(ItemDoacao.doacao),
            joinedload(AvaliacaoTriagemDoacao.item_doacao).joinedload(ItemDoacao.fotos)
        )\
        .filter(
            AvaliacaoTriagemDoacao.em_quarentena == True, 
            Doacao.ong_id == ong_id                       
        ).all()
        
    return analises

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
        motivo_inaptidao=dados.motivo_inaptidao
    )

    item.triado_por_id = voluntario.id
    item.triado_em = agora

    vinculo = obter_vinculo_voluntario(db,voluntario.id,item.doacao.ong_id)

    if vinculo.nivel_confianca < 10 and dados.resultado == ResultadoTriagemDoacao.PRE_APROVADO:
        avaliacao.em_quarentena = True
        avaliacao.resultado = ResultadoTriagemDoacao.EM_QUARENTENA
        item.status = StatusDoacao.EM_QUARENTENA
        item.doacao.status = StatusDoacao.EM_QUARENTENA
    else:    
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


def avaliar_analise_de_doacao(
    db: Session,
    coordenador: Usuario,
    analise_id: int,
    dados: RespostaAvaliacaoTriagemDoacao
) -> AvaliacaoTriagemDoacao:

    analise = obter_analise_material(db,analise_id)
    item = obter_item_doacao(db, analise.item_doacao.id)
    
    validar_usuario_coordenador(coordenador, item.doacao.ong_id)

    analise.coordenador_revisor_id = coordenador.id
    vinculo_voluntario = obter_vinculo_voluntario(db, analise.voluntario_triagem_id,item.doacao.ong_id)
    
    if dados.resultado_validado:
        analise.resultado_validado = dados.resultado_validado
        analise.em_quarentena = False
        agora = datetime.now()
        analise.validado_em = agora

        if vinculo_voluntario.nivel_confianca < 10:
            vinculo_voluntario.nivel_confianca += 1
        
        analise.resultado = ResultadoTriagemDoacao.PRE_APROVADO
        analise.item_doacao.status = StatusDoacao.PRE_APROVADO
        analise.item_doacao.doacao.status = StatusDoacao.PRE_APROVADO
        analise.item_doacao.pre_aprovado_em = agora
    
        sincronizar_status_doacao(item.doacao)
    else:
        if hasattr(dados, 'comentario_coordenador') and dados.comentario_coordenador:
            analise.comentario = f"[Revisão da Coordenação]: {dados.comentario_coordenador}"

        analise.em_quarentena = False
        analise.resultado = ResultadoTriagemDoacao.AGUARDANDO_NOVA_TRIAGEM
        analise.item_doacao.status = StatusDoacao.AGUARDANDO_NOVA_TRIAGEM
        analise.item.doacao.status = StatusDoacao.AGUARDANDO_NOVA_TRIAGEM

        if vinculo_voluntario.nivel_confianca > 0:
            vinculo_voluntario.nivel_confianca -= 1

    try:
        db.commit() 
        db.refresh(analise)
        return analise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao analisar a triagem.")


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
