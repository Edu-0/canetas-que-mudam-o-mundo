#!/usr/bin/env python3
"""Populate PostgreSQL with a complete, idempotent demo scenario.

Run from the backend directory:

    python scripts/seed_demo.py

The script uses the same PostgreSQL DATABASE_URL/DB_* environment variables as
the API. All generated records use deterministic demo identifiers, so the seed
can be run more than once without duplicating the presentation data.
"""

from __future__ import annotations

import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.enums import (  # noqa: E402
    BeneficiosUsuario,
    ResultadoTriagemDoacao,
    StatusDoacao,
    StatusPedidoMaterial,
    TipoUsuario,
)
from app.core.security import gerar_hash_senha 
from app.database.connection import Base, engine  
from app.models.auth import TokenDenyList  
from app.models.doacao import ( 
    AvaliacaoTriagemDoacao,
    Doacao,
    FotoItemDoacao,
    ItemDoacao,
)
from app.models.estoque import ItemEstoque
from app.models.movimento_estoque import MovimentoEstoque  
from app.models.ong import Ong, TokenOng, VoluntarioOng  
from app.models.pedido_material import ItemPedidoMaterial, PedidoMaterial 
from app.models.reserva_estoque import ReservaEstoque  
from app.models.user import (  
    DocumentoFamilia,
    DocumentoUsuario,
    FamiliaResponsavel,
    Usuario,
    UsuarioFuncao,
    UsuarioResponsavel,
)
from app.services.doacao_service import sincronizar_status_doacao


DEMO_PREFIX = "[SEED-DEMO:"
DEMO_PASSWORD = "Demo@12345"

_PASSWORD_HASH: str | None = None


def get_demo_password_hash() -> str:
    global _PASSWORD_HASH
    if _PASSWORD_HASH is None:
        _PASSWORD_HASH = gerar_hash_senha(DEMO_PASSWORD)
    return _PASSWORD_HASH


def marker(code: str) -> str:
    return f"{DEMO_PREFIX}{code}]"


def with_marker(code: str, text: str) -> str:
    return f"{marker(code)} {text}"


def demo_image(label: str) -> str:
    text = label.strip().replace(" ", "+")
    return f"https://placehold.co/900x650/eaf4ff/1f2937?text={text}"


def create_schema() -> None:
    ensure_postgresql()
    Base.metadata.create_all(bind=engine)


def ensure_postgresql() -> None:
    if engine.dialect.name != "postgresql":
        raise RuntimeError(
            "Esta seed de demonstracao deve ser executada em PostgreSQL. "
            "Configure DATABASE_URL com postgresql+psycopg2://... ou as "
            "variaveis DB_USER, DB_PASS, DB_HOST, DB_PORT e DB_NAME antes de rodar."
        )


def reset_roles(db: Session, usuario: Usuario, roles: list[TipoUsuario]) -> None:
    db.query(UsuarioFuncao).filter(
        UsuarioFuncao.usuario_id == usuario.id
    ).delete(synchronize_session=False)

    for role in roles:
        db.add(UsuarioFuncao(usuario_id=usuario.id, tipo_usuario=role))


def ensure_user(
    db: Session,
    *,
    nome: str,
    data_nascimento: date,
    cpf: str,
    cep: str,
    telefone: str,
    email: str,
    roles: list[TipoUsuario],
    now: datetime,
) -> Usuario:
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is None:
        usuario = db.query(Usuario).filter(Usuario.cpf == cpf).first()

    if usuario is None:
        usuario = Usuario(
            nome_completo=nome,
            data_nascimento=data_nascimento,
            cpf=cpf,
            cep=cep,
            telefone=telefone,
            email=email,
            senha=get_demo_password_hash(),
            ativo=True,
            data_cadastro=now - timedelta(days=20),
            data_edicao_conta=now,
        )
        db.add(usuario)

    usuario.nome_completo = nome
    usuario.data_nascimento = data_nascimento
    usuario.cpf = cpf
    usuario.cep = cep
    usuario.telefone = telefone
    usuario.email = email
    usuario.senha = get_demo_password_hash()
    usuario.ativo = True
    usuario.data_edicao_conta = now

    db.flush()
    reset_roles(db, usuario, roles)
    db.flush()
    return usuario


def ensure_ong(db: Session, *, coordenador: Usuario, now: datetime) -> Ong:
    cnpj = "90000000000101"
    ong = db.query(Ong).filter(Ong.cnpj == cnpj).first()
    if ong is None:
        ong = db.query(Ong).filter(Ong.usuario_id == coordenador.id).first()

    if ong is None:
        ong = Ong(usuario_id=coordenador.id, cnpj=cnpj)
        db.add(ong)

    ong.usuario_id = coordenador.id
    ong.nome = "Instituto Ponte do Saber"
    ong.cnpj = cnpj
    ong.cep = "01001000"
    ong.rua = "Rua da Aprendizagem"
    ong.bairro = "Centro"
    ong.cidade = "Sao Paulo"
    ong.estado = "SP"
    ong.numero = "125"
    ong.complemento = "Sala 3"
    ong.telefone = "11950000001"
    ong.email = "contato@pontedosaber.org"
    ong.sobre = (
        "Organizacao social que recebe materiais escolares, realiza triagem "
        "com voluntarios e distribui kits para criancas acompanhadas por "
        "responsaveis cadastrados."
    )
    ong.instagram = "https://instagram.com/pontedosaber.demo"
    ong.facebook = "https://facebook.com/pontedosaber.demo"
    ong.site = "https://pontedosaber.demo"
    ong.hora_abertura = time(8, 30)
    ong.hora_fechamento = time(17, 30)
    ong.dias_funcionamento = [1, 2, 3, 4, 5]
    ong.data_edicao = now
    ong.ativa = True

    db.flush()
    return ong


def ensure_volunteer_link(
    db: Session,
    *,
    usuario: Usuario,
    ong: Ong,
    nivel_confianca: int,
) -> VoluntarioOng:
    vinculo = db.query(VoluntarioOng).filter(
        VoluntarioOng.usuario_id == usuario.id
    ).first()
    if vinculo is None:
        vinculo = VoluntarioOng(usuario_id=usuario.id, ong_id=ong.id)
        db.add(vinculo)

    vinculo.ong_id = ong.id
    vinculo.nivel_confianca = nivel_confianca
    db.flush()
    return vinculo


def ensure_token(
    db: Session,
    *,
    ong: Ong,
    token: str,
    usado: bool,
    criado_em: datetime,
    data_expiracao: datetime,
    usado_em: datetime | None = None,
) -> TokenOng:
    token_ong = db.query(TokenOng).filter(TokenOng.token == token).first()
    if token_ong is None:
        token_ong = TokenOng(token=token, ong_id=ong.id)
        db.add(token_ong)

    token_ong.ong_id = ong.id
    token_ong.usado = usado
    token_ong.criado_em = criado_em
    token_ong.data_expiracao = data_expiracao
    token_ong.usado_em = usado_em
    db.flush()
    return token_ong


def ensure_responsible_profile(
    db: Session,
    *,
    usuario: Usuario,
    qtd_familiares: int,
    renda: float,
    auxilio: BeneficiosUsuario,
    documentacao_aprovada: bool,
    now: datetime,
) -> UsuarioResponsavel:
    perfil = db.query(UsuarioResponsavel).filter(
        UsuarioResponsavel.responsavel_id == usuario.id
    ).first()
    if perfil is None:
        perfil = UsuarioResponsavel(responsavel_id=usuario.id)
        db.add(perfil)

    perfil.qtd_familiares = qtd_familiares
    perfil.renda = renda
    perfil.auxilio = auxilio
    perfil.concordou_termos = True
    perfil.data_preenchimento_termos = now - timedelta(days=12)
    perfil.data_edicao_conta = now
    perfil.documentacao_aprovada = documentacao_aprovada
    perfil.ativo = True

    db.flush()
    return perfil


def ensure_family_member(
    db: Session,
    *,
    perfil: UsuarioResponsavel,
    nome: str,
    cpf: str,
    parentesco: str,
    data_nascimento: date,
    renda: float,
    beneficiario: bool,
) -> FamiliaResponsavel:
    familiar = db.query(FamiliaResponsavel).filter(
        FamiliaResponsavel.responsavel_id == perfil.id,
        FamiliaResponsavel.cpf == cpf,
    ).first()

    if familiar is None:
        familiar = FamiliaResponsavel(responsavel_id=perfil.id, cpf=cpf)
        db.add(familiar)

    familiar.nome = nome
    familiar.parentesco = parentesco
    familiar.data_nascimento = data_nascimento
    familiar.renda = renda
    familiar.beneficiario = beneficiario
    familiar.ativo = True

    db.flush()
    return familiar


def ensure_documento_usuario(
    db: Session,
    *,
    perfil: UsuarioResponsavel,
    tipo_documento: str,
    nome_original: str,
    caminho_arquivo: str,
    pendente_exclusao: bool,
    data_upload: datetime,
) -> DocumentoUsuario:
    documento = db.query(DocumentoUsuario).filter(
        DocumentoUsuario.responsavel_id == perfil.id,
        DocumentoUsuario.tipo_documento == tipo_documento,
        DocumentoUsuario.nome_original == nome_original,
    ).first()

    if documento is None:
        documento = DocumentoUsuario(
            responsavel_id=perfil.id,
            tipo_documento=tipo_documento,
            nome_original=nome_original,
        )
        db.add(documento)

    documento.caminho_arquivo = caminho_arquivo
    documento.data_upload = data_upload
    documento.pendente_exclusao = pendente_exclusao
    db.flush()
    return documento


def ensure_documento_familia(
    db: Session,
    *,
    familiar: FamiliaResponsavel,
    tipo_documento: str,
    nome_original: str,
    caminho_arquivo: str,
    pendente_exclusao: bool,
    data_upload: datetime,
) -> DocumentoFamilia:
    documento = db.query(DocumentoFamilia).filter(
        DocumentoFamilia.familiar_id == familiar.id,
        DocumentoFamilia.tipo_documento == tipo_documento,
        DocumentoFamilia.nome_original == nome_original,
    ).first()

    if documento is None:
        documento = DocumentoFamilia(
            familiar_id=familiar.id,
            tipo_documento=tipo_documento,
            nome_original=nome_original,
        )
        db.add(documento)

    documento.caminho_arquivo = caminho_arquivo
    documento.data_upload = data_upload
    documento.pendente_exclusao = pendente_exclusao
    db.flush()
    return documento


def ensure_donation(
    db: Session,
    *,
    code: str,
    doador: Usuario,
    ong: Ong,
    observacao: str,
    created_at: datetime,
    email_status_enviado_em: datetime | None = None,
) -> Doacao:
    prefix = marker(code)
    doacao = db.query(Doacao).filter(
        Doacao.observacao_doador.like(f"{prefix}%")
    ).first()

    if doacao is None:
        doacao = Doacao(doador_id=doador.id, ong_id=ong.id)
        db.add(doacao)

    doacao.doador_id = doador.id
    doacao.ong_id = ong.id
    doacao.observacao_doador = with_marker(code, observacao)
    doacao.email_status_enviado_em = email_status_enviado_em
    doacao.created_at = created_at
    doacao.updated_at = created_at + timedelta(hours=2)

    db.flush()
    return doacao


def ensure_donation_item(
    db: Session,
    *,
    code: str,
    doacao: Doacao,
    tipo_material: str,
    descricao: str,
    quantidade: int,
    status_item: StatusDoacao,
    created_at: datetime,
    possiveis_defeitos: str | None = None,
    motivo_inaptidao: str | None = None,
    triado_por: Usuario | None = None,
    recebido_por: Usuario | None = None,
    coletado_por: Usuario | None = None,
    triado_em: datetime | None = None,
    pre_aprovado_em: datetime | None = None,
    recebido_em: datetime | None = None,
    disponivel_em: datetime | None = None,
    coletado_em: datetime | None = None,
    stock_retirado_em: datetime | None = None,
    photo_labels: list[str] | None = None,
) -> ItemDoacao:
    prefix = marker(code)
    item = db.query(ItemDoacao).filter(
        ItemDoacao.doacao_id == doacao.id,
        ItemDoacao.descricao.like(f"{prefix}%"),
    ).first()

    if item is None:
        item = ItemDoacao(doacao_id=doacao.id)
        db.add(item)

    item.tipo_material = tipo_material
    item.descricao = with_marker(code, descricao)
    item.possiveis_defeitos = possiveis_defeitos
    item.quantidade = quantidade
    item.status = status_item
    item.motivo_inaptidao = motivo_inaptidao
    item.triado_por_id = triado_por.id if triado_por else None
    item.recebido_por_id = recebido_por.id if recebido_por else None
    item.coletado_por_id = coletado_por.id if coletado_por else None
    item.triado_em = triado_em
    item.pre_aprovado_em = pre_aprovado_em
    item.recebido_em = recebido_em
    item.disponivel_em = disponivel_em
    item.coletado_em = coletado_em
    item.created_at = created_at
    item.updated_at = created_at + timedelta(hours=1)

    db.flush()

    db.query(FotoItemDoacao).filter(
        FotoItemDoacao.item_doacao_id == item.id
    ).delete(synchronize_session=False)
    for index, label in enumerate(photo_labels or [tipo_material], start=1):
        db.add(
            FotoItemDoacao(
                item_doacao_id=item.id,
                url=demo_image(label),
                nome_original=f"{code.lower()}-{index}.png",
                content_type="image/png",
                tamanho_bytes=180_000 + index,
                checksum=f"seed-demo-{code.lower()}-{index}",
            )
        )

    if status_item in {StatusDoacao.DISPONIVEL, StatusDoacao.MATERIAL_COLETADO}:
        ensure_stock(
            db,
            item=item,
            disponivel_em=disponivel_em or created_at,
            retirado_em=stock_retirado_em,
        )
    else:
        remove_stock(db, item)

    db.flush()
    return item


def ensure_stock(
    db: Session,
    *,
    item: ItemDoacao,
    disponivel_em: datetime,
    retirado_em: datetime | None,
) -> ItemEstoque:
    estoque = db.query(ItemEstoque).filter(
        ItemEstoque.item_doacao_id == item.id
    ).first()

    if estoque is None:
        estoque = ItemEstoque(item_doacao_id=item.id)
        db.add(estoque)

    estoque.disponivel_em = disponivel_em
    estoque.retirado_em = retirado_em
    estoque.updated_at = datetime.now().replace(microsecond=0)
    db.flush()
    return estoque


def remove_stock(db: Session, item: ItemDoacao) -> None:
    db.query(ItemEstoque).filter(
        ItemEstoque.item_doacao_id == item.id
    ).delete(synchronize_session=False)


def ensure_evaluation(
    db: Session,
    *,
    code: str,
    item: ItemDoacao,
    voluntario: Usuario,
    resultado: ResultadoTriagemDoacao,
    checklist: dict[str, Any],
    comentario: str,
    created_at: datetime,
    motivo_inaptidao: str | None = None,
    em_quarentena: bool = False,
    coordenador: Usuario | None = None,
    resultado_validado: bool | None = None,
    validado_em: datetime | None = None,
) -> AvaliacaoTriagemDoacao:
    prefix = marker(code)
    avaliacao = db.query(AvaliacaoTriagemDoacao).filter(
        AvaliacaoTriagemDoacao.item_doacao_id == item.id,
        AvaliacaoTriagemDoacao.comentario.like(f"{prefix}%"),
    ).first()

    if avaliacao is None:
        avaliacao = AvaliacaoTriagemDoacao(
            item_doacao_id=item.id,
            voluntario_triagem_id=voluntario.id,
        )
        db.add(avaliacao)

    avaliacao.voluntario_triagem_id = voluntario.id
    avaliacao.resultado = resultado
    avaliacao.checklist = checklist
    avaliacao.comentario = with_marker(code, comentario)
    avaliacao.motivo_inaptidao = motivo_inaptidao
    avaliacao.em_quarentena = em_quarentena
    avaliacao.coordenador_revisor_id = coordenador.id if coordenador else None
    avaliacao.resultado_validado = resultado_validado
    avaliacao.validado_em = validado_em
    avaliacao.created_at = created_at

    db.flush()
    return avaliacao


def sync_donations(*doacoes: Doacao) -> None:
    for doacao in doacoes:
        sincronizar_status_doacao(doacao)


def ensure_order(
    db: Session,
    *,
    responsavel: Usuario,
    familiar: FamiliaResponsavel,
    ong: Ong,
    status_pedido: StatusPedidoMaterial,
    created_at: datetime,
    itens: list[dict[str, Any]],
    codigo_coleta: str | None = None,
    prazo_retirada_limite: datetime | None = None,
    notificacao_aprovacao_enviada_em: datetime | None = None,
) -> tuple[PedidoMaterial, dict[str, ItemPedidoMaterial]]:
    pedido = None
    if codigo_coleta:
        pedido = db.query(PedidoMaterial).filter(
            PedidoMaterial.codigo_coleta == codigo_coleta
        ).first()
    else:
        pedido = find_order_by_items(
            db,
            responsavel_id=responsavel.id,
            familiar_id=familiar.id,
            ong_id=ong.id,
            status_pedido=status_pedido,
            itens=itens,
        )

    if pedido is None:
        pedido = PedidoMaterial(
            responsavel_id=responsavel.id,
            familiar_id=familiar.id,
            ong_id=ong.id,
        )
        db.add(pedido)

    pedido.responsavel_id = responsavel.id
    pedido.familiar_id = familiar.id
    pedido.ong_id = ong.id
    pedido.status = status_pedido
    pedido.codigo_coleta = codigo_coleta
    pedido.prazo_retirada_limite = prazo_retirada_limite
    pedido.notificacao_aprovacao_enviada_em = notificacao_aprovacao_enviada_em
    pedido.created_at = created_at
    pedido.updated_at = created_at + timedelta(hours=1)
    db.flush()

    item_map: dict[str, ItemPedidoMaterial] = {}
    for item_data in itens:
        item = ensure_order_item(db, pedido=pedido, **item_data)
        item_map[item.tipo_material] = item

    db.flush()
    return pedido, item_map


def find_order_by_items(
    db: Session,
    *,
    responsavel_id: int,
    familiar_id: int,
    ong_id: int,
    status_pedido: StatusPedidoMaterial,
    itens: list[dict[str, Any]],
) -> PedidoMaterial | None:
    target = sorted(
        (
            item["tipo_material"],
            item["quantidade"],
            item["status_item"],
        )
        for item in itens
    )

    candidates = db.query(PedidoMaterial).filter(
        PedidoMaterial.responsavel_id == responsavel_id,
        PedidoMaterial.familiar_id == familiar_id,
        PedidoMaterial.ong_id == ong_id,
        PedidoMaterial.status == status_pedido,
        PedidoMaterial.codigo_coleta.is_(None),
    ).all()

    for candidate in candidates:
        current = sorted(
            (item.tipo_material, item.quantidade, item.status)
            for item in candidate.itens
        )
        if current == target:
            return candidate
    return None


def ensure_order_item(
    db: Session,
    *,
    pedido: PedidoMaterial,
    tipo_material: str,
    quantidade: int,
    status_item: StatusPedidoMaterial,
    aprovado_em: datetime | None = None,
    coletado_em: datetime | None = None,
    notificado_disponivel_em: datetime | None = None,
) -> ItemPedidoMaterial:
    item = db.query(ItemPedidoMaterial).filter(
        ItemPedidoMaterial.pedido_material_id == pedido.id,
        ItemPedidoMaterial.tipo_material == tipo_material,
    ).first()

    if item is None:
        item = ItemPedidoMaterial(
            pedido_material_id=pedido.id,
            tipo_material=tipo_material,
        )
        db.add(item)

    item.quantidade = quantidade
    item.status = status_item
    item.aprovado_em = aprovado_em
    item.coletado_em = coletado_em
    item.notificado_disponivel_em = notificado_disponivel_em

    db.flush()
    return item


def ensure_reservation(
    db: Session,
    *,
    item_pedido: ItemPedidoMaterial,
    item_doacao: ItemDoacao,
    quantidade: int,
    reservado_em: datetime,
    consumido_em: datetime | None = None,
    consumido_por: Usuario | None = None,
) -> ReservaEstoque:
    reserva = db.query(ReservaEstoque).filter(
        ReservaEstoque.item_pedido_material_id == item_pedido.id,
        ReservaEstoque.item_doacao_id == item_doacao.id,
    ).first()

    if reserva is None:
        reserva = ReservaEstoque(
            item_pedido_material_id=item_pedido.id,
            item_doacao_id=item_doacao.id,
        )
        db.add(reserva)

    reserva.quantidade = quantidade
    reserva.reservado_em = reservado_em
    reserva.consumido_em = consumido_em
    reserva.consumido_por_id = consumido_por.id if consumido_por else None
    db.flush()
    return reserva


def remove_reservations_for_item(db: Session, item_pedido: ItemPedidoMaterial) -> None:
    db.query(ReservaEstoque).filter(
        ReservaEstoque.item_pedido_material_id == item_pedido.id
    ).delete(synchronize_session=False)


def ensure_movement(
    db: Session,
    *,
    code: str,
    tipo: str,
    item_pedido: ItemPedidoMaterial,
    item_doacao: ItemDoacao,
    quantidade: int,
    usuario: Usuario,
    detalhe: str,
    created_at: datetime,
) -> MovimentoEstoque:
    prefix = marker(code)
    movimento = db.query(MovimentoEstoque).filter(
        MovimentoEstoque.detalhe.like(f"{prefix}%")
    ).first()

    if movimento is None:
        movimento = MovimentoEstoque(tipo=tipo, detalhe=prefix)
        db.add(movimento)

    movimento.tipo = tipo
    movimento.item_pedido_material_id = item_pedido.id
    movimento.item_doacao_id = item_doacao.id
    movimento.quantidade = quantidade
    movimento.usuario_id = usuario.id
    movimento.detalhe = with_marker(code, detalhe)
    movimento.created_at = created_at

    db.flush()
    return movimento


def seed_users_and_ong(db: Session, now: datetime) -> dict[str, Any]:
    users = {
        "coordenador": ensure_user(
            db,
            nome="Carla Menezes",
            data_nascimento=date(1986, 4, 18),
            cpf="90000000001",
            cep="01001000",
            telefone="11950000001",
            email="demo.coordenador@canetas.example",
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
            now=now,
        ),
        "triagem_senior": ensure_user(
            db,
            nome="Bruno Lima",
            data_nascimento=date(1991, 7, 9),
            cpf="90000000002",
            cep="01310930",
            telefone="11950000002",
            email="demo.triagem.senior@canetas.example",
            roles=[TipoUsuario.GENERICO, TipoUsuario.TRIAGEM],
            now=now,
        ),
        "triagem_nova": ensure_user(
            db,
            nome="Nina Rocha",
            data_nascimento=date(1998, 11, 21),
            cpf="90000000003",
            cep="04094050",
            telefone="11950000003",
            email="demo.triagem.nova@canetas.example",
            roles=[TipoUsuario.GENERICO, TipoUsuario.TRIAGEM],
            now=now,
        ),
        "doador_marina": ensure_user(
            db,
            nome="Marina Andrade",
            data_nascimento=date(1989, 2, 14),
            cpf="90000000004",
            cep="04567000",
            telefone="11950000004",
            email="demo.doador.marina@canetas.example",
            roles=[TipoUsuario.DOADOR],
            now=now,
        ),
        "doador_rafael": ensure_user(
            db,
            nome="Rafael Costa",
            data_nascimento=date(1984, 9, 5),
            cpf="90000000005",
            cep="05010000",
            telefone="11950000005",
            email="demo.doador.rafael@canetas.example",
            roles=[TipoUsuario.DOADOR],
            now=now,
        ),
        "responsavel_luciana": ensure_user(
            db,
            nome="Luciana Santos",
            data_nascimento=date(1987, 5, 30),
            cpf="90000000006",
            cep="08235000",
            telefone="11950000006",
            email="demo.responsavel.luciana@canetas.example",
            roles=[TipoUsuario.GENERICO, TipoUsuario.RESPONSAVEL_BENEFICIARIO],
            now=now,
        ),
        "responsavel_patricia": ensure_user(
            db,
            nome="Patricia Almeida",
            data_nascimento=date(1990, 12, 3),
            cpf="90000000007",
            cep="03245010",
            telefone="11950000007",
            email="demo.responsavel.patricia@canetas.example",
            roles=[TipoUsuario.GENERICO, TipoUsuario.RESPONSAVEL_BENEFICIARIO],
            now=now,
        ),
        "generico": ensure_user(
            db,
            nome="Diego Souza",
            data_nascimento=date(1995, 1, 12),
            cpf="90000000008",
            cep="02020020",
            telefone="11950000008",
            email="demo.generico@canetas.example",
            roles=[TipoUsuario.GENERICO],
            now=now,
        ),
    }

    ong = ensure_ong(db, coordenador=users["coordenador"], now=now)
    ensure_volunteer_link(
        db,
        usuario=users["triagem_senior"],
        ong=ong,
        nivel_confianca=10,
    )
    ensure_volunteer_link(
        db,
        usuario=users["triagem_nova"],
        ong=ong,
        nivel_confianca=3,
    )

    ensure_token(
        db,
        ong=ong,
        token="seed-demo-token-ponte-saber-ativo",
        usado=False,
        criado_em=now - timedelta(hours=1),
        data_expiracao=now + timedelta(days=5),
    )
    ensure_token(
        db,
        ong=ong,
        token="seed-demo-token-ponte-saber-usado",
        usado=True,
        criado_em=now - timedelta(days=2),
        data_expiracao=now + timedelta(days=3),
        usado_em=now - timedelta(days=1, hours=18),
    )
    ensure_token(
        db,
        ong=ong,
        token="seed-demo-token-ponte-saber-expirado",
        usado=False,
        criado_em=now - timedelta(days=4),
        data_expiracao=now - timedelta(days=3),
    )

    return {"users": users, "ong": ong}


def seed_responsaveis(db: Session, users: dict[str, Usuario], now: datetime) -> dict[str, Any]:
    perfil_luciana = ensure_responsible_profile(
        db,
        usuario=users["responsavel_luciana"],
        qtd_familiares=3,
        renda=1450.00,
        auxilio=BeneficiosUsuario.BOLSA_FAMILIA,
        documentacao_aprovada=True,
        now=now,
    )
    perfil_patricia = ensure_responsible_profile(
        db,
        usuario=users["responsavel_patricia"],
        qtd_familiares=2,
        renda=2200.00,
        auxilio=BeneficiosUsuario.BPC,
        documentacao_aprovada=True,
        now=now,
    )

    familiares = {
        "ana": ensure_family_member(
            db,
            perfil=perfil_luciana,
            nome="Ana Santos",
            cpf="90000001001",
            parentesco="Filha",
            data_nascimento=date(2015, 3, 12),
            renda=0.0,
            beneficiario=True,
        ),
        "joao": ensure_family_member(
            db,
            perfil=perfil_luciana,
            nome="Joao Santos",
            cpf="90000001002",
            parentesco="Filho",
            data_nascimento=date(2012, 8, 22),
            renda=0.0,
            beneficiario=True,
        ),
        "rosa": ensure_family_member(
            db,
            perfil=perfil_luciana,
            nome="Rosa Santos",
            cpf="90000001003",
            parentesco="Mae",
            data_nascimento=date(1958, 10, 2),
            renda=800.0,
            beneficiario=False,
        ),
        "miguel": ensure_family_member(
            db,
            perfil=perfil_patricia,
            nome="Miguel Almeida",
            cpf="90000001004",
            parentesco="Filho",
            data_nascimento=date(2014, 6, 7),
            renda=0.0,
            beneficiario=True,
        ),
        "beatriz": ensure_family_member(
            db,
            perfil=perfil_patricia,
            nome="Beatriz Almeida",
            cpf="90000001005",
            parentesco="Filha",
            data_nascimento=date(2007, 1, 16),
            renda=0.0,
            beneficiario=False,
        ),
    }

    ensure_documento_usuario(
        db,
        perfil=perfil_luciana,
        tipo_documento="IDENTIDADE",
        nome_original="rg-luciana.pdf",
        caminho_arquivo="https://storage.demo.local/documentos/rg-luciana.pdf",
        pendente_exclusao=False,
        data_upload=now - timedelta(days=11),
    )
    ensure_documento_usuario(
        db,
        perfil=perfil_luciana,
        tipo_documento="COMPROVANTE_RENDA",
        nome_original="comprovante-renda-luciana.pdf",
        caminho_arquivo="https://storage.demo.local/documentos/renda-luciana.pdf",
        pendente_exclusao=False,
        data_upload=now - timedelta(days=10),
    )
    ensure_documento_usuario(
        db,
        perfil=perfil_patricia,
        tipo_documento="IDENTIDADE",
        nome_original="rg-patricia.pdf",
        caminho_arquivo="https://storage.demo.local/documentos/rg-patricia.pdf",
        pendente_exclusao=False,
        data_upload=now - timedelta(days=7),
    )
    ensure_documento_usuario(
        db,
        perfil=perfil_patricia,
        tipo_documento="COMPROVANTE_RENDA",
        nome_original="comprovante-antigo-patricia.pdf",
        caminho_arquivo="https://storage.demo.local/documentos/renda-antiga-patricia.pdf",
        pendente_exclusao=True,
        data_upload=now - timedelta(days=20),
    )

    for key, familiar in familiares.items():
        ensure_documento_familia(
            db,
            familiar=familiar,
            tipo_documento="COMPROVANTE_ESCOLAR",
            nome_original=f"comprovante-escolar-{key}.pdf",
            caminho_arquivo=f"https://storage.demo.local/documentos/comprovante-escolar-{key}.pdf",
            pendente_exclusao=(key == "beatriz"),
            data_upload=now - timedelta(days=6),
        )

    return {
        "perfis": {
            "luciana": perfil_luciana,
            "patricia": perfil_patricia,
        },
        "familiares": familiares,
    }


def triage_checklist(*, qualidade: str = "boa") -> dict[str, Any]:
    return {
        "limpo": True,
        "funcional": qualidade != "ruim",
        "sem_risco": qualidade != "ruim",
        "qualidade_visual": qualidade,
    }


def seed_doacoes(
    db: Session,
    *,
    users: dict[str, Usuario],
    ong: Ong,
    now: datetime,
) -> dict[str, ItemDoacao]:
    senior = users["triagem_senior"]
    nova = users["triagem_nova"]
    coordenador = users["coordenador"]

    d_pending = ensure_donation(
        db,
        code="DON-PENDING",
        doador=users["doador_marina"],
        ong=ong,
        observacao="Doadora consegue entregar no periodo da manha.",
        created_at=now - timedelta(days=4, hours=3),
    )
    ensure_donation_item(
        db,
        code="ITEM-PENDING-CADERNO",
        doacao=d_pending,
        tipo_material="Caderno universitario",
        descricao="Doze cadernos com poucas paginas usadas, aguardando primeira triagem.",
        quantidade=12,
        status_item=StatusDoacao.AGUARDANDO_TRIAGEM,
        created_at=now - timedelta(days=4, hours=3),
        possiveis_defeitos="Algumas capas com marcas de uso.",
        photo_labels=["Cadernos aguardando triagem"],
    )
    ensure_donation_item(
        db,
        code="ITEM-PENDING-MOCHILA",
        doacao=d_pending,
        tipo_material="Mochila escolar",
        descricao="Duas mochilas resistentes aguardando conferencia de ziper e alcas.",
        quantidade=2,
        status_item=StatusDoacao.AGUARDANDO_TRIAGEM,
        created_at=now - timedelta(days=4, hours=3),
        possiveis_defeitos="Uma mochila tem pequena mancha lateral.",
        photo_labels=["Mochilas aguardando triagem"],
    )

    d_new_triage = ensure_donation(
        db,
        code="DON-NOVA-TRIAGEM",
        doador=users["doador_rafael"],
        ong=ong,
        observacao="Material voltou para nova avaliacao depois de revisao da coordenacao.",
        created_at=now - timedelta(days=3, hours=5),
    )
    item_new_triage = ensure_donation_item(
        db,
        code="ITEM-NOVA-TRIAGEM",
        doacao=d_new_triage,
        tipo_material="Calculadora simples",
        descricao="Calculadoras basicas; coordenacao pediu nova triagem por duvida no funcionamento.",
        quantidade=4,
        status_item=StatusDoacao.AGUARDANDO_NOVA_TRIAGEM,
        created_at=now - timedelta(days=3, hours=5),
        triado_por=nova,
        triado_em=now - timedelta(days=3, hours=2),
        photo_labels=["Calculadoras nova triagem"],
    )
    ensure_evaluation(
        db,
        code="AVAL-NOVA-TRIAGEM",
        item=item_new_triage,
        voluntario=nova,
        resultado=ResultadoTriagemDoacao.PRE_APROVADO,
        checklist=triage_checklist(qualidade="media"),
        comentario="Voluntaria considerou apto, mas a coordenacao discordou e solicitou nova triagem.",
        created_at=now - timedelta(days=3, hours=2),
        em_quarentena=False,
        coordenador=coordenador,
        resultado_validado=False,
        validado_em=now - timedelta(days=2, hours=20),
    )

    d_pre_approved = ensure_donation(
        db,
        code="DON-PRE-APROVADA",
        doador=users["doador_marina"],
        ong=ong,
        observacao="Material ja foi pre-aprovado e aguarda entrega fisica na ONG.",
        created_at=now - timedelta(days=2, hours=6),
        email_status_enviado_em=now - timedelta(days=2, hours=1),
    )
    item_pre_approved = ensure_donation_item(
        db,
        code="ITEM-PRE-APROVADO",
        doacao=d_pre_approved,
        tipo_material="Kit de reguas",
        descricao="Kits com regua, esquadro e transferidor sem trincas aparentes.",
        quantidade=15,
        status_item=StatusDoacao.PRE_APROVADO,
        created_at=now - timedelta(days=2, hours=6),
        triado_por=senior,
        triado_em=now - timedelta(days=2, hours=5),
        pre_aprovado_em=now - timedelta(days=2, hours=5),
        photo_labels=["Kits pre aprovados"],
    )
    ensure_evaluation(
        db,
        code="AVAL-PRE-APROVADO",
        item=item_pre_approved,
        voluntario=senior,
        resultado=ResultadoTriagemDoacao.PRE_APROVADO,
        checklist=triage_checklist(),
        comentario="Material completo e seguro para recebimento fisico.",
        created_at=now - timedelta(days=2, hours=5),
    )

    d_available = ensure_donation(
        db,
        code="DON-ESTOQUE",
        doador=users["doador_rafael"],
        ong=ong,
        observacao="Lote ja recebido fisicamente e disponivel para pedidos.",
        created_at=now - timedelta(days=6, hours=4),
    )
    available_specs = [
        ("ITEM-ESTOQUE-CADERNO", "Caderno universitario", 42, "Cadernos revisados, limpos e separados por materia."),
        ("ITEM-ESTOQUE-CANETA", "Caneta azul", 36, "Canetas testadas com tinta azul e escrita continua."),
        ("ITEM-ESTOQUE-LAPIS", "Lapis preto", 50, "Lapis apontados e agrupados em lotes."),
        ("ITEM-ESTOQUE-BORRACHA", "Borracha branca", 30, "Borrachas novas em embalagem simples."),
        ("ITEM-ESTOQUE-MOCHILA", "Mochila escolar", 3, "Mochilas higienizadas e com ziper funcionando."),
    ]
    available_items: dict[str, ItemDoacao] = {}
    for index, (code, tipo, quantidade, descricao) in enumerate(available_specs):
        item = ensure_donation_item(
            db,
            code=code,
            doacao=d_available,
            tipo_material=tipo,
            descricao=descricao,
            quantidade=quantidade,
            status_item=StatusDoacao.DISPONIVEL,
            created_at=now - timedelta(days=6, hours=4 - index),
            triado_por=senior,
            recebido_por=senior,
            triado_em=now - timedelta(days=6, hours=2),
            pre_aprovado_em=now - timedelta(days=6, hours=2),
            recebido_em=now - timedelta(days=5, hours=22),
            disponivel_em=now - timedelta(days=5, hours=22),
            photo_labels=[f"{tipo} disponivel"],
        )
        available_items[tipo] = item
        ensure_evaluation(
            db,
            code=f"AVAL-{code}",
            item=item,
            voluntario=senior,
            resultado=ResultadoTriagemDoacao.PRE_APROVADO,
            checklist=triage_checklist(),
            comentario=f"{tipo} aprovado e recebido no estoque.",
            created_at=now - timedelta(days=6, hours=2),
        )

    d_quarantine = ensure_donation(
        db,
        code="DON-QUARENTENA",
        doador=users["doador_marina"],
        ong=ong,
        observacao="Analise de voluntaria nova esta aguardando revisao da coordenacao.",
        created_at=now - timedelta(days=1, hours=8),
    )
    item_quarantine = ensure_donation_item(
        db,
        code="ITEM-QUARENTENA",
        doacao=d_quarantine,
        tipo_material="Estojo completo",
        descricao="Estojos completos avaliados por voluntaria com baixa confianca.",
        quantidade=5,
        status_item=StatusDoacao.PRE_APROVADO,
        created_at=now - timedelta(days=1, hours=8),
        triado_por=nova,
        triado_em=now - timedelta(days=1, hours=7),
        pre_aprovado_em=now - timedelta(days=1, hours=7),
        photo_labels=["Estojos em quarentena"],
    )
    ensure_evaluation(
        db,
        code="AVAL-QUARENTENA",
        item=item_quarantine,
        voluntario=nova,
        resultado=ResultadoTriagemDoacao.PRE_APROVADO,
        checklist=triage_checklist(qualidade="boa"),
        comentario="Pre-aprovacao feita por voluntaria nova; precisa validacao da coordenacao.",
        created_at=now - timedelta(days=1, hours=7),
        em_quarentena=True,
    )

    d_inapt = ensure_donation(
        db,
        code="DON-INAPTA",
        doador=users["doador_rafael"],
        ong=ong,
        observacao="Exemplo de doacao recusada por risco ou baixa qualidade.",
        created_at=now - timedelta(days=5, hours=1),
    )
    item_inapt = ensure_donation_item(
        db,
        code="ITEM-INAPTO",
        doacao=d_inapt,
        tipo_material="Apontador",
        descricao="Apontadores com laminas enferrujadas e risco de uso.",
        quantidade=20,
        status_item=StatusDoacao.INAPTO,
        created_at=now - timedelta(days=5, hours=1),
        motivo_inaptidao="Laminas enferrujadas e risco de corte.",
        triado_por=senior,
        triado_em=now - timedelta(days=5),
        photo_labels=["Apontadores inaptos"],
    )
    ensure_evaluation(
        db,
        code="AVAL-INAPTO",
        item=item_inapt,
        voluntario=senior,
        resultado=ResultadoTriagemDoacao.INAPTO,
        checklist=triage_checklist(qualidade="ruim"),
        comentario="Material reprovado por seguranca.",
        motivo_inaptidao="Laminas enferrujadas e risco de corte.",
        created_at=now - timedelta(days=5),
    )

    d_incomplete = ensure_donation(
        db,
        code="DON-INCOMPLETA",
        doador=users["doador_marina"],
        ong=ong,
        observacao="Doacao com item incompleto para demonstrar prioridade de status.",
        created_at=now - timedelta(days=1, hours=2),
    )
    ensure_donation_item(
        db,
        code="ITEM-INCOMPLETO",
        doacao=d_incomplete,
        tipo_material="Livro didatico",
        descricao="Livro didatico sem paginas essenciais, marcado como incompleto.",
        quantidade=7,
        status_item=StatusDoacao.INCOMPLETO,
        created_at=now - timedelta(days=1, hours=2),
        triado_por=senior,
        triado_em=now - timedelta(days=1),
        possiveis_defeitos="Faltam paginas de exercicios.",
        photo_labels=["Livro incompleto"],
    )
    ensure_donation_item(
        db,
        code="ITEM-INCOMPLETO-AGUARDANDO",
        doacao=d_incomplete,
        tipo_material="Caneta hidrocor",
        descricao="Canetas hidrocor da mesma doacao ainda aguardando conferencia.",
        quantidade=9,
        status_item=StatusDoacao.AGUARDANDO_TRIAGEM,
        created_at=now - timedelta(days=1, hours=2),
        photo_labels=["Canetas aguardando na doacao incompleta"],
    )

    d_reserved = ensure_donation(
        db,
        code="DON-RESERVADA-CANETAS",
        doador=users["doador_rafael"],
        ong=ong,
        observacao="Lote reservado para pedido aprovado, ainda aguardando retirada.",
        created_at=now - timedelta(days=8),
    )
    item_reserved_canetas = ensure_donation_item(
        db,
        code="ITEM-RESERVA-CANETAS",
        doacao=d_reserved,
        tipo_material="Caneta azul",
        descricao="Dez canetas reservadas integralmente para um pedido aprovado.",
        quantidade=10,
        status_item=StatusDoacao.MATERIAL_COLETADO,
        created_at=now - timedelta(days=8),
        triado_por=senior,
        recebido_por=senior,
        coletado_por=senior,
        triado_em=now - timedelta(days=7, hours=22),
        pre_aprovado_em=now - timedelta(days=7, hours=22),
        recebido_em=now - timedelta(days=7, hours=20),
        disponivel_em=now - timedelta(days=7, hours=20),
        coletado_em=now - timedelta(days=1, hours=3),
        stock_retirado_em=now - timedelta(days=1, hours=3),
        photo_labels=["Canetas reservadas"],
    )

    d_collected = ensure_donation(
        db,
        code="DON-COLETADA-MOCHILA",
        doador=users["doador_marina"],
        ong=ong,
        observacao="Lote ja entregue a beneficiario em pedido concluido.",
        created_at=now - timedelta(days=9),
    )
    item_collected_mochila = ensure_donation_item(
        db,
        code="ITEM-COLETA-MOCHILA",
        doacao=d_collected,
        tipo_material="Mochila escolar",
        descricao="Mochila consumida por pedido ja retirado.",
        quantidade=1,
        status_item=StatusDoacao.MATERIAL_COLETADO,
        created_at=now - timedelta(days=9),
        triado_por=senior,
        recebido_por=senior,
        coletado_por=senior,
        triado_em=now - timedelta(days=8, hours=22),
        pre_aprovado_em=now - timedelta(days=8, hours=22),
        recebido_em=now - timedelta(days=8, hours=20),
        disponivel_em=now - timedelta(days=8, hours=20),
        coletado_em=now - timedelta(days=2, hours=4),
        stock_retirado_em=now - timedelta(days=2, hours=4),
        photo_labels=["Mochila coletada"],
    )

    d_canceled = ensure_donation(
        db,
        code="DON-LIBERADA-CADERNOS",
        doador=users["doador_rafael"],
        ong=ong,
        observacao="Lote que foi liberado de volta ao estoque apos cancelamento de pedido.",
        created_at=now - timedelta(days=7),
    )
    item_canceled_cadernos = ensure_donation_item(
        db,
        code="ITEM-LIBERACAO-CADERNOS",
        doacao=d_canceled,
        tipo_material="Caderno universitario",
        descricao="Cinco cadernos liberados de volta ao estoque depois de cancelamento.",
        quantidade=5,
        status_item=StatusDoacao.DISPONIVEL,
        created_at=now - timedelta(days=7),
        triado_por=senior,
        recebido_por=senior,
        triado_em=now - timedelta(days=6, hours=23),
        pre_aprovado_em=now - timedelta(days=6, hours=23),
        recebido_em=now - timedelta(days=6, hours=22),
        disponivel_em=now - timedelta(hours=12),
        photo_labels=["Cadernos liberados"],
    )

    sync_donations(
        d_pending,
        d_new_triage,
        d_pre_approved,
        d_available,
        d_quarantine,
        d_inapt,
        d_incomplete,
        d_reserved,
        d_collected,
        d_canceled,
    )

    return {
        **available_items,
        "reserved_canetas": item_reserved_canetas,
        "collected_mochila": item_collected_mochila,
        "canceled_cadernos": item_canceled_cadernos,
    }


def seed_pedidos(
    db: Session,
    *,
    users: dict[str, Usuario],
    familiares: dict[str, FamiliaResponsavel],
    ong: Ong,
    donation_items: dict[str, ItemDoacao],
    now: datetime,
) -> None:
    pending_order, _ = ensure_order(
        db,
        responsavel=users["responsavel_luciana"],
        familiar=familiares["ana"],
        ong=ong,
        status_pedido=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
        created_at=now - timedelta(hours=10),
        itens=[
            {
                "tipo_material": "Caderno universitario",
                "quantidade": 6,
                "status_item": StatusPedidoMaterial.AGUARDANDO_APROVACAO,
                "notificado_disponivel_em": now - timedelta(hours=8),
            },
            {
                "tipo_material": "Borracha branca",
                "quantidade": 4,
                "status_item": StatusPedidoMaterial.AGUARDANDO_APROVACAO,
                "notificado_disponivel_em": None,
            },
        ],
    )
    pending_order.status = StatusPedidoMaterial.AGUARDANDO_APROVACAO

    awaiting_order, awaiting_items = ensure_order(
        db,
        responsavel=users["responsavel_luciana"],
        familiar=familiares["joao"],
        ong=ong,
        status_pedido=StatusPedidoMaterial.AGUARDANDO_RETIRADA,
        codigo_coleta="10458273",
        prazo_retirada_limite=now + timedelta(days=5),
        notificacao_aprovacao_enviada_em=now - timedelta(days=1, hours=2),
        created_at=now - timedelta(days=1, hours=5),
        itens=[
            {
                "tipo_material": "Caneta azul",
                "quantidade": 10,
                "status_item": StatusPedidoMaterial.AGUARDANDO_RETIRADA,
                "aprovado_em": now - timedelta(days=1, hours=2),
                "notificado_disponivel_em": now - timedelta(days=1, hours=2),
            }
        ],
    )
    item_awaiting = awaiting_items["Caneta azul"]
    ensure_reservation(
        db,
        item_pedido=item_awaiting,
        item_doacao=donation_items["reserved_canetas"],
        quantidade=10,
        reservado_em=now - timedelta(days=1, hours=2),
    )
    ensure_movement(
        db,
        code="MOV-RESERVA-CANETAS",
        tipo="RESERVA",
        item_pedido=item_awaiting,
        item_doacao=donation_items["reserved_canetas"],
        quantidade=10,
        usuario=users["triagem_senior"],
        detalhe="Reserva criada ao aprovar pedido de canetas.",
        created_at=now - timedelta(days=1, hours=2),
    )
    awaiting_order.status = StatusPedidoMaterial.AGUARDANDO_RETIRADA

    collected_order, collected_items = ensure_order(
        db,
        responsavel=users["responsavel_patricia"],
        familiar=familiares["miguel"],
        ong=ong,
        status_pedido=StatusPedidoMaterial.MATERIAL_COLETADO,
        codigo_coleta="20458273",
        prazo_retirada_limite=now + timedelta(days=2),
        notificacao_aprovacao_enviada_em=now - timedelta(days=3),
        created_at=now - timedelta(days=3, hours=4),
        itens=[
            {
                "tipo_material": "Mochila escolar",
                "quantidade": 1,
                "status_item": StatusPedidoMaterial.MATERIAL_COLETADO,
                "aprovado_em": now - timedelta(days=3),
                "coletado_em": now - timedelta(days=2, hours=4),
                "notificado_disponivel_em": now - timedelta(days=3),
            }
        ],
    )
    item_collected = collected_items["Mochila escolar"]
    ensure_reservation(
        db,
        item_pedido=item_collected,
        item_doacao=donation_items["collected_mochila"],
        quantidade=1,
        reservado_em=now - timedelta(days=3),
        consumido_em=now - timedelta(days=2, hours=4),
        consumido_por=users["triagem_senior"],
    )
    ensure_movement(
        db,
        code="MOV-RESERVA-MOCHILA",
        tipo="RESERVA",
        item_pedido=item_collected,
        item_doacao=donation_items["collected_mochila"],
        quantidade=1,
        usuario=users["triagem_senior"],
        detalhe="Reserva criada para pedido de mochila.",
        created_at=now - timedelta(days=3),
    )
    ensure_movement(
        db,
        code="MOV-CONSUMO-MOCHILA",
        tipo="CONSUMO",
        item_pedido=item_collected,
        item_doacao=donation_items["collected_mochila"],
        quantidade=1,
        usuario=users["triagem_senior"],
        detalhe="Material entregue ao responsavel no ato da retirada.",
        created_at=now - timedelta(days=2, hours=4),
    )
    collected_order.status = StatusPedidoMaterial.MATERIAL_COLETADO

    canceled_order, canceled_items = ensure_order(
        db,
        responsavel=users["responsavel_patricia"],
        familiar=familiares["miguel"],
        ong=ong,
        status_pedido=StatusPedidoMaterial.CANCELADO,
        codigo_coleta="30458273",
        prazo_retirada_limite=now - timedelta(days=1),
        notificacao_aprovacao_enviada_em=now - timedelta(days=4),
        created_at=now - timedelta(days=4, hours=8),
        itens=[
            {
                "tipo_material": "Caderno universitario",
                "quantidade": 5,
                "status_item": StatusPedidoMaterial.CANCELADO,
                "aprovado_em": now - timedelta(days=4),
                "notificado_disponivel_em": now - timedelta(days=4),
            }
        ],
    )
    item_canceled = canceled_items["Caderno universitario"]
    remove_reservations_for_item(db, item_canceled)
    ensure_movement(
        db,
        code="MOV-LIBERACAO-CADERNOS",
        tipo="LIBERACAO",
        item_pedido=item_canceled,
        item_doacao=donation_items["canceled_cadernos"],
        quantidade=5,
        usuario=users["triagem_senior"],
        detalhe="Liberacao de reserva por cancelamento de pedido.",
        created_at=now - timedelta(hours=12),
    )
    canceled_order.status = StatusPedidoMaterial.CANCELADO


def run_seed() -> None:
    create_schema()
    now = datetime.now().replace(microsecond=0)

    with Session(engine) as db:
        contexto = seed_users_and_ong(db, now)
        users = contexto["users"]
        ong = contexto["ong"]

        responsaveis = seed_responsaveis(db, users, now)
        donation_items = seed_doacoes(db, users=users, ong=ong, now=now)
        seed_pedidos(
            db,
            users=users,
            familiares=responsaveis["familiares"],
            ong=ong,
            donation_items=donation_items,
            now=now,
        )

        db.commit()

    print("Seed de demonstracao concluida com sucesso.")
    print(f"Senha dos usuarios demo: {DEMO_PASSWORD}")
    print("Logins principais:")
    print("  Coordenador: demo.coordenador@canetas.local")
    print("  Triagem senior: demo.triagem.senior@canetas.local")
    print("  Triagem nova: demo.triagem.nova@canetas.local")
    print("  Doador: demo.doador.marina@canetas.local")
    print("  Responsavel: demo.responsavel.luciana@canetas.local")
    print("Token ativo de convite: seed-demo-token-ponte-saber-ativo")


if __name__ == "__main__":
    run_seed()
