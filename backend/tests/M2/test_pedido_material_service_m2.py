from fastapi import HTTPException

from base import (
    M2ServiceTestCase,
    StatusDoacao,
    StatusPedidoMaterial,
)
from app.models.doacao import ItemDoacao
from app.models.estoque import ItemEstoque
from app.models.movimento_estoque import MovimentoEstoque
from app.models.pedido_material import ItemPedidoMaterial, PedidoMaterial
from app.models.reserva_estoque import ReservaEstoque
from app.schemas.pedido_material import CriarItemPedidoMaterial, CriarPedidoMaterial
from app.services import pedido_material_service


class PedidoMaterialServiceM2Test(M2ServiceTestCase):
    def criar_pedido_payload(self, ong, familiar, tipo="Caderno", quantidade=2):
        return CriarPedidoMaterial(
            ong_id=ong.id,
            familiar_id=familiar.id,
            itens=[
                CriarItemPedidoMaterial(
                    tipo_material=tipo,
                    quantidade=quantidade,
                )
            ],
        )

    def test_listar_materiais_disponiveis_agrupa_por_tipo_e_filtra_ong(self):
        ong = self.make_ong()
        outra_ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Caderno",
            quantidade=5,
            status_item=StatusDoacao.DISPONIVEL,
        )
        self.make_item_doacao(
            ong=ong,
            tipo_material="Caderno",
            quantidade=7,
            status_item=StatusDoacao.DISPONIVEL,
        )
        self.make_item_doacao(
            ong=ong,
            tipo_material="Mochila",
            quantidade=1,
            status_item=StatusDoacao.DISPONIVEL,
        )
        self.make_item_doacao(
            ong=outra_ong,
            tipo_material="Caderno",
            quantidade=99,
            status_item=StatusDoacao.DISPONIVEL,
        )

        materiais = pedido_material_service.listar_materiais_disponiveis(self.db, ong.id)

        self.assertEqual(
            materiais,
            [
                {"tipo_material": "Caderno", "quantidade_disponivel": 12},
                {"tipo_material": "Mochila", "quantidade_disponivel": 1},
            ],
        )

    def test_responsavel_cria_pedido_para_familiar_beneficiario(self):
        ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Lapis",
            quantidade=10,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible(documentacao_aprovada=True)
        familiar = self.make_family(perfil=perfil, beneficiario=True)

        pedido = pedido_material_service.criar_pedido_material(
            self.db,
            responsavel,
            self.criar_pedido_payload(ong, familiar, tipo="Lapis", quantidade=4),
        )

        self.assertEqual(pedido.status, StatusPedidoMaterial.AGUARDANDO_APROVACAO)
        self.assertEqual(pedido.familiar_id, familiar.id)
        self.assertEqual(pedido.itens[0].quantidade, 4)

    def test_comportamento_atual_responsavel_sem_documentacao_aprovada_ainda_cria_pedido(self):
        ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Lapis",
            quantidade=10,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible(documentacao_aprovada=False)
        familiar = self.make_family(perfil=perfil, beneficiario=True)

        pedido = pedido_material_service.criar_pedido_material(
            self.db,
            responsavel,
            self.criar_pedido_payload(ong, familiar, tipo="Lapis", quantidade=1),
        )

        self.assertEqual(pedido.status, StatusPedidoMaterial.AGUARDANDO_APROVACAO)

    def test_nao_cria_pedido_para_familiar_nao_beneficiario(self):
        ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Lapis",
            quantidade=10,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil, beneficiario=False)

        with self.assertRaises(HTTPException) as contexto:
            pedido_material_service.criar_pedido_material(
                self.db,
                responsavel,
                self.criar_pedido_payload(ong, familiar, tipo="Lapis", quantidade=1),
            )

        self.assertEqual(contexto.exception.status_code, 404)

    def test_pedido_nao_pode_ultrapassar_vinte_materiais_por_beneficiario(self):
        ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Caderno",
            quantidade=30,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)

        with self.assertRaises(HTTPException) as contexto:
            pedido_material_service.criar_pedido_material(
                self.db,
                responsavel,
                self.criar_pedido_payload(ong, familiar, tipo="Caderno", quantidade=21),
            )

        self.assertEqual(contexto.exception.status_code, 400)

    def test_pedido_respeita_total_ativo_ja_solicitado(self):
        ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Caderno",
            quantidade=30,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)
        pedido_existente = PedidoMaterial(
            responsavel_id=responsavel.id,
            familiar_id=familiar.id,
            ong_id=ong.id,
            status=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
        )
        self.db.add(pedido_existente)
        self.db.flush()
        self.db.add(
            ItemPedidoMaterial(
                pedido_material_id=pedido_existente.id,
                tipo_material="Caderno",
                quantidade=18,
                status=StatusPedidoMaterial.AGUARDANDO_APROVACAO,
            )
        )
        self.db.flush()

        with self.assertRaises(HTTPException) as contexto:
            pedido_material_service.criar_pedido_material(
                self.db,
                responsavel,
                self.criar_pedido_payload(ong, familiar, tipo="Caderno", quantidade=3),
            )

        self.assertEqual(contexto.exception.status_code, 400)

    def test_nao_cria_pedido_de_material_indisponivel_ou_quantidade_maior_que_estoque(self):
        ong = self.make_ong()
        self.make_item_doacao(
            ong=ong,
            tipo_material="Borracha",
            quantidade=2,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)
        self.db.commit()

        with self.assertRaises(HTTPException):
            pedido_material_service.criar_pedido_material(
                self.db,
                responsavel,
                self.criar_pedido_payload(ong, familiar, tipo="Caneta", quantidade=1),
            )

        with self.assertRaises(HTTPException):
            pedido_material_service.criar_pedido_material(
                self.db,
                responsavel,
                self.criar_pedido_payload(ong, familiar, tipo="Borracha", quantidade=3),
            )

    def test_aprovar_item_reserva_estoque_gera_codigo_prazo_e_movimento(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        item_doacao = self.make_item_doacao(
            ong=ong,
            tipo_material="Caneta",
            quantidade=10,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)
        pedido = pedido_material_service.criar_pedido_material(
            self.db,
            responsavel,
            self.criar_pedido_payload(ong, familiar, tipo="Caneta", quantidade=4),
        )
        item_pedido = pedido.itens[0]

        aprovado = pedido_material_service.aprovar_item_pedido_material(
            self.db,
            voluntario,
            item_pedido.id,
        )
        self.db.refresh(item_doacao)

        reserva = self.db.query(ReservaEstoque).filter(
            ReservaEstoque.item_pedido_material_id == aprovado.id
        ).first()
        movimento = self.db.query(MovimentoEstoque).filter(
            MovimentoEstoque.item_pedido_material_id == aprovado.id,
            MovimentoEstoque.tipo == "RESERVA",
        ).first()

        self.assertEqual(aprovado.status, StatusPedidoMaterial.AGUARDANDO_RETIRADA)
        self.assertIsNotNone(aprovado.pedido.codigo_coleta)
        self.assertIsNotNone(aprovado.pedido.prazo_retirada_limite)
        self.assertEqual(reserva.quantidade, 4)
        self.assertEqual(movimento.quantidade, 4)
        self.assertEqual(item_doacao.quantidade, 6)

    def test_coletar_item_com_reserva_registra_consumo_e_finaliza_pedido(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        item_doacao = self.make_item_doacao(
            ong=ong,
            tipo_material="Mochila",
            quantidade=1,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)
        pedido = pedido_material_service.criar_pedido_material(
            self.db,
            responsavel,
            self.criar_pedido_payload(ong, familiar, tipo="Mochila", quantidade=1),
        )
        item_pedido = pedido_material_service.aprovar_item_pedido_material(
            self.db,
            voluntario,
            pedido.itens[0].id,
        )

        coletado = pedido_material_service.coletar_item_pedido_material(
            self.db,
            voluntario,
            item_pedido.id,
        )
        self.db.refresh(item_doacao)

        consumo = self.db.query(MovimentoEstoque).filter(
            MovimentoEstoque.item_pedido_material_id == coletado.id,
            MovimentoEstoque.tipo == "CONSUMO",
        ).first()

        self.assertEqual(coletado.status, StatusPedidoMaterial.MATERIAL_COLETADO)
        self.assertEqual(coletado.pedido.status, StatusPedidoMaterial.MATERIAL_COLETADO)
        self.assertEqual(item_doacao.status, StatusDoacao.MATERIAL_COLETADO)
        self.assertIsNotNone(consumo)

    def test_comportamento_atual_cancelar_reserva_total_retorna_material_ao_estoque(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        item_doacao = self.make_item_doacao(
            ong=ong,
            tipo_material="Caderno",
            quantidade=5,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)
        pedido = pedido_material_service.criar_pedido_material(
            self.db,
            responsavel,
            self.criar_pedido_payload(ong, familiar, tipo="Caderno", quantidade=5),
        )
        item_pedido = pedido_material_service.aprovar_item_pedido_material(
            self.db,
            voluntario,
            pedido.itens[0].id,
        )

        cancelado = pedido_material_service.cancelar_item_pedido_material(
            self.db,
            voluntario,
            item_pedido.id,
        )
        self.db.refresh(item_doacao)
        estoque = self.db.query(ItemEstoque).filter(
            ItemEstoque.item_doacao_id == item_doacao.id
        ).first()

        self.assertEqual(cancelado.status, StatusPedidoMaterial.CANCELADO)
        self.assertEqual(item_doacao.status, StatusDoacao.DISPONIVEL)
        self.assertEqual(item_doacao.quantidade, 10)
        self.assertIsNone(estoque.retirado_em)
        self.assertEqual(
            self.db.query(ReservaEstoque)
            .filter(ReservaEstoque.item_pedido_material_id == item_pedido.id)
            .count(),
            0,
        )

    def test_listar_pedidos_e_historico_respeitam_perfil_do_usuario(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        self.make_item_doacao(
            ong=ong,
            tipo_material="Caneta",
            quantidade=10,
            status_item=StatusDoacao.DISPONIVEL,
        )
        responsavel, perfil = self.make_responsible()
        familiar = self.make_family(perfil=perfil)
        pedido = pedido_material_service.criar_pedido_material(
            self.db,
            responsavel,
            self.criar_pedido_payload(ong, familiar, tipo="Caneta", quantidade=2),
        )

        pedidos_responsavel = pedido_material_service.listar_pedidos(self.db, responsavel)
        pedidos_ong = pedido_material_service.listar_pedidos(self.db, voluntario)
        historico = pedido_material_service.listar_movimentos_pedido(
            self.db,
            responsavel,
            pedido.id,
        )

        self.assertEqual([p.id for p in pedidos_responsavel], [pedido.id])
        self.assertEqual([p.id for p in pedidos_ong], [pedido.id])
        self.assertEqual(historico, [])

        outro_responsavel, _ = self.make_responsible()
        with self.assertRaises(HTTPException):
            pedido_material_service.listar_movimentos_pedido(
                self.db,
                outro_responsavel,
                pedido.id,
            )
