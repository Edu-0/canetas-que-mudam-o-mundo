import os
import tempfile
import unittest
from datetime import date, datetime, time, timedelta


TEST_DATABASE_URL = os.getenv("M2_TEST_DATABASE_URL")
if TEST_DATABASE_URL:
    if "test" not in TEST_DATABASE_URL.lower():
        raise RuntimeError(
            "M2_TEST_DATABASE_URL deve apontar para um banco de teste "
            "e conter 'test' na URL, pois a suite recria todas as tabelas."
        )
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
else:
    os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.NamedTemporaryFile(delete=False).name}"
os.environ.setdefault("SECRET_KEY", "m2-test-secret")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

from sqlalchemy.orm import Session  # noqa: E402

from app.core.enums import (  # noqa: E402
    BeneficiosUsuario,
    ResultadoTriagemDoacao,
    StatusDoacao,
    StatusPedidoMaterial,
    TipoUsuario,
)
from app.core.security import gerar_hash_senha  # noqa: E402
from app.database.connection import Base, engine  # noqa: E402
from app.models.auth import TokenDenyList  # noqa: E402,F401
from app.models.doacao import Doacao, FotoItemDoacao, ItemDoacao  # noqa: E402
from app.models.estoque import ItemEstoque  # noqa: E402
from app.models.movimento_estoque import MovimentoEstoque  # noqa: E402,F401
from app.models.ong import Ong, TokenOng, VoluntarioOng  # noqa: E402
from app.models.pedido_material import ItemPedidoMaterial, PedidoMaterial  # noqa: E402,F401
from app.models.reserva_estoque import ReservaEstoque  # noqa: E402,F401
from app.models.user import (  # noqa: E402
    DocumentoFamilia,
    DocumentoUsuario,
    FamiliaResponsavel,
    Usuario,
    UsuarioFuncao,
    UsuarioResponsavel,
)
from app.schemas.doacao import (  # noqa: E402
    CriarDoacao,
    CriarFotoItemDoacao,
    CriarItemDoacao,
)


class DescriptiveTestCaseMixin:
    def shortDescription(self):
        nome_teste = getattr(self, "_testMethodName", "")
        if not nome_teste.startswith("test_"):
            return super().shortDescription()

        descricao = nome_teste.removeprefix("test_").replace("_", " ")
        return f"[M2] {descricao.capitalize()}"


class M2ServiceTestCase(DescriptiveTestCaseMixin, unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        self.db = Session(engine)
        self.now = datetime.now().replace(microsecond=0)
        self._cpf_counter = 10_000_000_000
        self._cnpj_counter = 90_000_000_000_100
        self._email_counter = 0

    def tearDown(self):
        self.db.rollback()
        self.db.close()

    def make_user(
        self,
        *,
        roles: list[TipoUsuario] | None = None,
        email: str | None = None,
        nome: str = "Usuario Teste",
        senha: str = "Aa1!senha",
        ativo: bool = True,
    ) -> Usuario:
        self._email_counter += 1
        self._cpf_counter += 1
        usuario = Usuario(
            nome_completo=nome,
            data_nascimento=date(1990, 1, 1),
            cpf=str(self._cpf_counter).zfill(11),
            cep="88300000",
            telefone="47999999999",
            email=email or f"m2.usuario.{self._email_counter}@example.com",
            senha=gerar_hash_senha(senha),
            ativo=ativo,
            data_cadastro=self.now,
            data_edicao_conta=self.now,
        )
        self.db.add(usuario)
        self.db.flush()

        for role in roles or [TipoUsuario.GENERICO]:
            self.db.add(UsuarioFuncao(usuario_id=usuario.id, tipo_usuario=role))

        self.db.flush()
        return usuario

    def make_ong(self, *, coordenador: Usuario | None = None, ativa: bool = True) -> Ong:
        coordenador = coordenador or self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
            nome="Coordenador Teste",
        )
        self._cnpj_counter += 1
        ong = Ong(
            usuario_id=coordenador.id,
            nome=f"ONG Teste {self._cnpj_counter}",
            cnpj=str(self._cnpj_counter).zfill(14),
            cep="88300000",
            rua="Rua Teste",
            bairro="Centro",
            cidade="Itajai",
            estado="SC",
            numero="100",
            complemento=None,
            telefone="47999999999",
            email=f"ong.{self._cnpj_counter}@example.com",
            sobre="ONG usada nos testes automatizados de regras da M2.",
            hora_abertura=time(8, 0),
            hora_fechamento=time(17, 0),
            dias_funcionamento=[1, 2, 3, 4, 5],
            ativa=ativa,
        )
        self.db.add(ong)
        self.db.flush()
        return ong

    def make_volunteer(
        self,
        *,
        ong: Ong,
        nivel_confianca: int = 10,
        nome: str = "Voluntario Teste",
    ) -> Usuario:
        usuario = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.TRIAGEM],
            nome=nome,
        )
        self.db.add(
            VoluntarioOng(
                usuario_id=usuario.id,
                ong_id=ong.id,
                nivel_confianca=nivel_confianca,
            )
        )
        self.db.flush()
        return usuario

    def make_donor(self, *, nome: str = "Doador Teste") -> Usuario:
        return self.make_user(roles=[TipoUsuario.DOADOR], nome=nome)

    def make_responsible(
        self,
        *,
        nome: str = "Responsavel Teste",
        renda: float = 1200.0,
        documentacao_aprovada: bool = True,
    ) -> tuple[Usuario, UsuarioResponsavel]:
        usuario = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.RESPONSAVEL_BENEFICIARIO],
            nome=nome,
        )
        perfil = UsuarioResponsavel(
            responsavel_id=usuario.id,
            qtd_familiares=0,
            renda=renda,
            auxilio=BeneficiosUsuario.NENHUM,
            concordou_termos=True,
            documentacao_aprovada=documentacao_aprovada,
            ativo=True,
        )
        self.db.add(perfil)
        self.db.flush()
        return usuario, perfil

    def make_family(
        self,
        *,
        perfil: UsuarioResponsavel,
        beneficiario: bool = True,
        ativo: bool = True,
        nome: str = "Beneficiario Teste",
    ) -> FamiliaResponsavel:
        self._cpf_counter += 1
        familiar = FamiliaResponsavel(
            responsavel_id=perfil.id,
            nome=nome,
            cpf=str(self._cpf_counter).zfill(11),
            parentesco="Filho",
            data_nascimento=date(2015, 1, 1),
            renda=0.0,
            beneficiario=beneficiario,
            ativo=ativo,
        )
        self.db.add(familiar)
        perfil.qtd_familiares += 1
        self.db.flush()
        return familiar

    def make_documentos_responsavel(self, perfil: UsuarioResponsavel) -> None:
        self.db.add_all(
            [
                DocumentoUsuario(
                    responsavel_id=perfil.id,
                    tipo_documento="IDENTIDADE",
                    nome_original="identidade.pdf",
                    caminho_arquivo="https://storage.test/identidade.pdf",
                ),
                DocumentoUsuario(
                    responsavel_id=perfil.id,
                    tipo_documento="COMPROVANTE_RENDA",
                    nome_original="renda.pdf",
                    caminho_arquivo="https://storage.test/renda.pdf",
                ),
            ]
        )
        self.db.flush()

    def make_documento_familia(self, familiar: FamiliaResponsavel) -> DocumentoFamilia:
        doc = DocumentoFamilia(
            familiar_id=familiar.id,
            tipo_documento="COMPROVANTE_ESCOLAR",
            nome_original="escolar.pdf",
            caminho_arquivo="https://storage.test/escolar.pdf",
        )
        self.db.add(doc)
        self.db.flush()
        return doc

    def photo(self, name: str = "foto.jpg") -> CriarFotoItemDoacao:
        return CriarFotoItemDoacao(
            url=f"https://storage.test/{name}",
            nome_original=name,
            content_type="image/jpeg",
            tamanho_bytes=1024,
            checksum=f"checksum-{name}",
        )

    def donation_payload(
        self,
        *,
        ong: Ong,
        tipo_material: str = "Caderno",
        quantidade: int = 2,
    ) -> CriarDoacao:
        return CriarDoacao(
            ong_id=ong.id,
            observacao_doador="Doacao de teste",
            itens=[
                CriarItemDoacao(
                    tipo_material=tipo_material,
                    descricao=f"{tipo_material} em bom estado",
                    possiveis_defeitos=None,
                    quantidade=quantidade,
                    fotos=[self.photo()],
                )
            ],
        )

    def make_item_doacao(
        self,
        *,
        ong: Ong,
        doador: Usuario | None = None,
        tipo_material: str = "Caderno",
        quantidade: int = 5,
        status_item: StatusDoacao = StatusDoacao.AGUARDANDO_TRIAGEM,
        created_at: datetime | None = None,
    ) -> ItemDoacao:
        doador = doador or self.make_donor()
        created_at = created_at or self.now
        doacao = Doacao(
            doador_id=doador.id,
            ong_id=ong.id,
            status=status_item,
            observacao_doador="Doacao criada por fixture",
            created_at=created_at,
            updated_at=created_at,
        )
        self.db.add(doacao)
        self.db.flush()

        item = ItemDoacao(
            doacao_id=doacao.id,
            tipo_material=tipo_material,
            descricao=f"{tipo_material} criado por fixture",
            quantidade=quantidade,
            status=status_item,
            created_at=created_at,
            updated_at=created_at,
        )
        if status_item in {StatusDoacao.PRE_APROVADO, StatusDoacao.DISPONIVEL}:
            item.triado_em = created_at
            item.pre_aprovado_em = created_at
        if status_item == StatusDoacao.DISPONIVEL:
            item.recebido_em = created_at
            item.disponivel_em = created_at

        self.db.add(item)
        self.db.flush()
        self.db.add(
            FotoItemDoacao(
                item_doacao_id=item.id,
                url="https://storage.test/item.jpg",
                nome_original="item.jpg",
                content_type="image/jpeg",
                tamanho_bytes=1024,
            )
        )
        if status_item == StatusDoacao.DISPONIVEL:
            self.db.add(ItemEstoque(item_doacao_id=item.id, disponivel_em=created_at))

        self.db.flush()
        return item

    def make_token_ong(
        self,
        *,
        ong: Ong,
        token: str = "token-m2-valido",
        expirado: bool = False,
    ) -> TokenOng:
        token_ong = TokenOng(
            ong_id=ong.id,
            token=token,
            usado=False,
            criado_em=self.now,
            data_expiracao=(
                self.now - timedelta(hours=1) if expirado else self.now + timedelta(hours=2)
            ),
        )
        self.db.add(token_ong)
        self.db.flush()
        return token_ong


__all__ = [
    "M2ServiceTestCase",
    "DescriptiveTestCaseMixin",
    "BeneficiosUsuario",
    "ResultadoTriagemDoacao",
    "StatusDoacao",
    "StatusPedidoMaterial",
    "TipoUsuario",
    "Usuario",
    "UsuarioFuncao",
    "UsuarioResponsavel",
    "FamiliaResponsavel",
    "Doacao",
    "ItemDoacao",
    "ItemEstoque",
    "TokenOng",
    "VoluntarioOng",
]
