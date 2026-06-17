from fastapi import HTTPException

from base import (
    M2ServiceTestCase,
    ResultadoTriagemDoacao,
    StatusDoacao,
    TipoUsuario,
)
from app.models.estoque import ItemEstoque
from app.models.ong import VoluntarioOng
from app.schemas.doacao import (
    AtualizarStatusItemDoacao,
    CriarAvaliacaoTriagemDoacao,
    RespostaRevisarAvaliacaoTriagem,
)
from app.services import doacao_service


class DoacaoServiceM2Test(M2ServiceTestCase):
    def test_doador_registra_doacao_com_fotos_e_status_inicial(self):
        ong = self.make_ong()
        doador = self.make_donor()

        doacao = doacao_service.criar_doacao(
            self.db,
            doador,
            self.donation_payload(ong=ong, tipo_material="Caderno", quantidade=3),
        )

        self.assertEqual(doacao.status, StatusDoacao.AGUARDANDO_TRIAGEM)
        self.assertEqual(len(doacao.itens), 1)
        self.assertEqual(doacao.itens[0].status, StatusDoacao.AGUARDANDO_TRIAGEM)
        self.assertEqual(len(doacao.itens[0].fotos), 1)

    def test_usuario_sem_papel_doador_nao_registra_doacao(self):
        ong = self.make_ong()
        responsavel, _ = self.make_responsible()

        with self.assertRaises(HTTPException) as contexto:
            doacao_service.criar_doacao(
                self.db,
                responsavel,
                self.donation_payload(ong=ong),
            )

        self.assertEqual(contexto.exception.status_code, 403)

    def test_triagem_pre_aprova_sem_colocar_no_estoque_ate_recebimento_fisico(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong, nivel_confianca=10)
        item = self.make_item_doacao(ong=ong)

        avaliacao = doacao_service.avaliar_item_doacao(
            self.db,
            voluntario,
            item.id,
            CriarAvaliacaoTriagemDoacao(
                resultado=ResultadoTriagemDoacao.PRE_APROVADO,
                checklist={"limpo": True, "funcional": True},
                comentario="Material apto para entrega fisica.",
            ),
        )
        self.db.refresh(item)

        self.assertEqual(avaliacao.resultado, ResultadoTriagemDoacao.PRE_APROVADO)
        self.assertEqual(item.status, StatusDoacao.PRE_APROVADO)
        self.assertIsNone(
            self.db.query(ItemEstoque)
            .filter(ItemEstoque.item_doacao_id == item.id)
            .first()
        )

    def test_recebimento_fisico_transforma_pre_aprovado_em_disponivel_e_cria_estoque(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong, nivel_confianca=10)
        item = self.make_item_doacao(ong=ong, status_item=StatusDoacao.PRE_APROVADO)

        item = doacao_service.alterar_status_item_doacao(
            self.db,
            voluntario,
            item.id,
            AtualizarStatusItemDoacao(status=StatusDoacao.DISPONIVEL),
        )

        estoque = (
            self.db.query(ItemEstoque)
            .filter(ItemEstoque.item_doacao_id == item.id)
            .first()
        )
        self.assertEqual(item.status, StatusDoacao.DISPONIVEL)
        self.assertEqual(item.recebido_por_id, voluntario.id)
        self.assertIsNotNone(estoque)
        self.assertIsNone(estoque.retirado_em)

    def test_comportamento_atual_coordenador_disponibiliza_material(self):
        coordenador = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
            nome="Coordenador Status",
        )
        ong = self.make_ong(coordenador=coordenador)
        item = self.make_item_doacao(ong=ong, status_item=StatusDoacao.PRE_APROVADO)

        item = doacao_service.alterar_status_item_doacao(
            self.db,
            coordenador,
            item.id,
            AtualizarStatusItemDoacao(status=StatusDoacao.DISPONIVEL),
        )

        self.assertEqual(item.status, StatusDoacao.DISPONIVEL)

    def test_nao_permite_disponibilizar_sem_pre_aprovacao(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        item = self.make_item_doacao(ong=ong)

        with self.assertRaises(HTTPException) as contexto:
            doacao_service.alterar_status_item_doacao(
                self.db,
                voluntario,
                item.id,
                AtualizarStatusItemDoacao(status=StatusDoacao.DISPONIVEL),
            )

        self.assertEqual(contexto.exception.status_code, 400)

    def test_inapto_exige_motivo_de_reprovacao(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        item = self.make_item_doacao(ong=ong)

        with self.assertRaises(HTTPException) as contexto:
            doacao_service.avaliar_item_doacao(
                self.db,
                voluntario,
                item.id,
                CriarAvaliacaoTriagemDoacao(resultado=ResultadoTriagemDoacao.INAPTO),
            )

        self.assertEqual(contexto.exception.status_code, 400)

    def test_voluntario_iniciante_entra_em_quarentena_e_coordenador_valida(self):
        coordenador = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
        )
        ong = self.make_ong(coordenador=coordenador)
        voluntario = self.make_volunteer(ong=ong, nivel_confianca=4)
        item = self.make_item_doacao(ong=ong)

        avaliacao = doacao_service.avaliar_item_doacao(
            self.db,
            voluntario,
            item.id,
            CriarAvaliacaoTriagemDoacao(
                resultado=ResultadoTriagemDoacao.PRE_APROVADO,
                checklist={"limpo": True},
            ),
        )
        revisada = doacao_service.avaliar_analise_de_doacao(
            self.db,
            coordenador,
            avaliacao.id,
            RespostaRevisarAvaliacaoTriagem(resultado_validado=True),
        )
        self.db.refresh(voluntario.vinculo_voluntario)

        self.assertFalse(revisada.em_quarentena)
        self.assertTrue(revisada.resultado_validado)
        self.assertEqual(voluntario.vinculo_voluntario.nivel_confianca, 5)

    def test_coordenador_corrige_quarentena_e_envia_para_nova_triagem(self):
        coordenador = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
        )
        ong = self.make_ong(coordenador=coordenador)
        voluntario = self.make_volunteer(ong=ong, nivel_confianca=3)
        item = self.make_item_doacao(ong=ong)

        avaliacao = doacao_service.avaliar_item_doacao(
            self.db,
            voluntario,
            item.id,
            CriarAvaliacaoTriagemDoacao(
                resultado=ResultadoTriagemDoacao.PRE_APROVADO,
                checklist={"limpo": False},
            ),
        )
        doacao_service.avaliar_analise_de_doacao(
            self.db,
            coordenador,
            avaliacao.id,
            RespostaRevisarAvaliacaoTriagem(
                resultado_validado=False,
                comentario_coordenador="Fotos insuficientes.",
            ),
        )
        self.db.refresh(item)
        vinculo = (
            self.db.query(VoluntarioOng)
            .filter(VoluntarioOng.usuario_id == voluntario.id)
            .first()
        )

        self.assertEqual(item.status, StatusDoacao.AGUARDANDO_NOVA_TRIAGEM)
        self.assertEqual(vinculo.nivel_confianca, 2)

    def test_listagem_por_perfil_filtra_doador_e_ong(self):
        ong_a = self.make_ong()
        ong_b = self.make_ong()
        doador_a = self.make_donor(nome="Doador A")
        doador_b = self.make_donor(nome="Doador B")
        voluntario_a = self.make_volunteer(ong=ong_a)

        item_a = self.make_item_doacao(ong=ong_a, doador=doador_a)
        self.make_item_doacao(ong=ong_b, doador=doador_b)
        self.make_item_doacao(
            ong=ong_a,
            doador=doador_a,
            status_item=StatusDoacao.DISPONIVEL,
        )

        doacoes_triagem = doacao_service.listar_doacoes(self.db, voluntario_a)
        doacoes_doador = doacao_service.listar_doacoes(self.db, doador_a)

        self.assertEqual([d.id for d in doacoes_triagem], [item_a.doacao_id])
        self.assertEqual(len(doacoes_doador), 2)
        self.assertTrue(all(doacao.doador_id == doador_a.id for doacao in doacoes_doador))

    def test_status_doacao_sincroniza_prioridade_incompleto(self):
        ong = self.make_ong()
        item_incompleto = self.make_item_doacao(
            ong=ong,
            status_item=StatusDoacao.INCOMPLETO,
        )
        item_disponivel = self.make_item_doacao(
            ong=ong,
            doador=item_incompleto.doacao.doador,
            status_item=StatusDoacao.DISPONIVEL,
        )
        item_disponivel.doacao_id = item_incompleto.doacao_id
        self.db.flush()

        doacao_service.sincronizar_status_doacao(item_incompleto.doacao)

        self.assertEqual(item_incompleto.doacao.status, StatusDoacao.INCOMPLETO)

    def test_notificacao_pre_aprovacao_exige_ao_menos_um_item_pre_aprovado(self):
        ong = self.make_ong()
        voluntario = self.make_volunteer(ong=ong)
        item = self.make_item_doacao(ong=ong)

        with self.assertRaises(HTTPException) as contexto:
            doacao_service.registrar_notificacao_pre_aprovacao(
                self.db,
                voluntario,
                item.doacao_id,
            )

        self.assertEqual(contexto.exception.status_code, 400)

    def test_comportamento_atual_coordenador_nao_registra_notificacao_sem_perfil_triagem(self):
        coordenador = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
        )
        ong = self.make_ong(coordenador=coordenador)
        item = self.make_item_doacao(ong=ong, status_item=StatusDoacao.PRE_APROVADO)

        with self.assertRaises(HTTPException) as contexto:
            doacao_service.registrar_notificacao_pre_aprovacao(
                self.db,
                coordenador,
                item.doacao_id,
            )

        self.assertEqual(contexto.exception.status_code, 403)
