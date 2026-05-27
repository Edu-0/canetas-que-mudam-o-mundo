from datetime import timedelta

from fastapi import HTTPException

from base import M2ServiceTestCase, TipoUsuario, UsuarioFuncao, VoluntarioOng
from app.core.deps_auth import VerificarPermissao
from app.core.security import (
    PERMISSOES_POR_FUNCAO,
    criar_access_token,
    verificar_senha,
)
from app.models.auth import TokenDenyList
from app.routes import auth as auth_routes
from app.routes import password as password_routes
from app.schemas.auth import LoginRequest
from app.schemas.password import PasswordResetConfirm
from app.services import ong_service, user_service


class UsuarioOngSecurityM2Test(M2ServiceTestCase):
    def test_criar_voluntario_com_token_valido_vincula_ong_e_marca_token_usado(self):
        ong = self.make_ong()
        token = self.make_token_ong(ong=ong, token="convite-valido")
        usuario = self.make_user(roles=[TipoUsuario.GENERICO])

        user_service.criar_voluntario(usuario.id, token.token, self.db)
        self.db.commit()

        funcoes = {
            f.tipo_usuario
            for f in self.db.query(UsuarioFuncao)
            .filter(UsuarioFuncao.usuario_id == usuario.id)
            .all()
        }
        vinculo = self.db.query(VoluntarioOng).filter(
            VoluntarioOng.usuario_id == usuario.id,
            VoluntarioOng.ong_id == ong.id,
        ).first()

        self.db.refresh(token)
        self.assertIn(TipoUsuario.GENERICO, funcoes)
        self.assertIn(TipoUsuario.TRIAGEM, funcoes)
        self.assertIsNotNone(vinculo)
        self.assertTrue(token.usado)
        self.assertIsNotNone(token.usado_em)

    def test_criar_voluntario_com_token_expirado_falha(self):
        ong = self.make_ong()
        token = self.make_token_ong(ong=ong, token="convite-expirado", expirado=True)
        usuario = self.make_user(roles=[TipoUsuario.GENERICO])

        with self.assertRaises(HTTPException) as contexto:
            user_service.criar_voluntario(usuario.id, token.token, self.db)

        self.assertEqual(contexto.exception.status_code, 401)

    def test_remover_voluntario_de_ong_ativa_remove_vinculo_e_anonimiza_usuario(self):
        ong = self.make_ong(ativa=True)
        voluntario = self.make_volunteer(ong=ong)
        email_original = voluntario.email

        ong_service.remover_voluntario_ong(
            self.db,
            voluntario_id=voluntario.id,
            ong_id=ong.id,
            ong_ativa=True,
        )
        self.db.refresh(voluntario)

        vinculo = self.db.query(VoluntarioOng).filter(
            VoluntarioOng.usuario_id == voluntario.id
        ).first()
        self.assertIsNone(vinculo)
        self.assertFalse(voluntario.ativo)
        self.assertNotEqual(voluntario.email, email_original)
        self.assertEqual(voluntario.nome_completo, "Usuário Anonimizado")

    def test_permissoes_rbac_cobrem_fluxos_principais_da_m2(self):
        self.assertIn("doacao:criar", PERMISSOES_POR_FUNCAO[TipoUsuario.DOADOR])
        self.assertIn("pedido:criar", PERMISSOES_POR_FUNCAO[TipoUsuario.RESPONSAVEL_BENEFICIARIO])
        self.assertIn("doacao_item:avaliar", PERMISSOES_POR_FUNCAO[TipoUsuario.TRIAGEM])
        self.assertIn("voluntario_ong:gerar-link-voluntario", PERMISSOES_POR_FUNCAO[TipoUsuario.COORDENADOR_PROCESSOS])

    def test_comportamento_atual_coordenador_nao_tem_permissao_para_status_dos_materiais(self):
        coordenador = self.make_user(
            roles=[TipoUsuario.GENERICO, TipoUsuario.COORDENADOR_PROCESSOS],
        )

        with self.assertRaises(HTTPException) as contexto:
            VerificarPermissao("doacao_item:alterar_status")(coordenador)

        self.assertEqual(contexto.exception.status_code, 401)
        self.assertNotIn(
            "doacao_item:alterar_status",
            PERMISSOES_POR_FUNCAO[TipoUsuario.COORDENADOR_PROCESSOS],
        )

    def test_login_e_logout_revogam_token(self):
        usuario = self.make_user(
            roles=[TipoUsuario.DOADOR],
            email="login.m2@example.com",
            senha="Aa1!senha",
        )

        resposta = auth_routes.login(
            LoginRequest(email=usuario.email, senha="Aa1!senha"),
            self.db,
        )
        logout = auth_routes.logout(
            self.db,
            current_user=usuario,
            token=resposta.access_token,
        )

        revogado = self.db.query(TokenDenyList).filter(
            TokenDenyList.token == resposta.access_token
        ).first()
        self.assertEqual(resposta.token_type, "bearer")
        self.assertEqual(logout.message, "Logout realizado com sucesso")
        self.assertIsNotNone(revogado)

    def test_login_rejeita_senha_incorreta(self):
        usuario = self.make_user(
            roles=[TipoUsuario.DOADOR],
            email="login.erro@example.com",
            senha="Aa1!senha",
        )

        with self.assertRaises(HTTPException) as contexto:
            auth_routes.login(
                LoginRequest(email=usuario.email, senha="senha-errada"),
                self.db,
            )

        self.assertEqual(contexto.exception.status_code, 401)

    def test_redefinir_senha_valida_scope_revoga_token_e_impede_reuso(self):
        usuario = self.make_user(roles=[TipoUsuario.DOADOR], senha="Aa1!senha")
        token = criar_access_token(
            data={"sub": str(usuario.id), "scope": "password_reset"},
            expires_delta=timedelta(minutes=15),
        )

        resposta = password_routes.redefinir_senha(
            PasswordResetConfirm(token=token, nova_senha="Nova@123"),
            self.db,
        )
        self.db.refresh(usuario)

        with self.assertRaises(HTTPException) as contexto:
            password_routes.redefinir_senha(
                PasswordResetConfirm(token=token, nova_senha="Outra@123"),
                self.db,
            )

        self.assertEqual(resposta["mensagem"], "Senha alterada com sucesso!")
        self.assertTrue(verificar_senha("Nova@123", usuario.senha))
        self.assertEqual(contexto.exception.status_code, 401)

    def test_redefinir_senha_rejeita_token_sem_scope_password_reset(self):
        usuario = self.make_user(roles=[TipoUsuario.DOADOR])
        token = criar_access_token(
            data={"sub": str(usuario.id)},
            expires_delta=timedelta(minutes=15),
        )

        with self.assertRaises(HTTPException) as contexto:
            password_routes.redefinir_senha(
                PasswordResetConfirm(token=token, nova_senha="Nova@123"),
                self.db,
            )

        self.assertEqual(contexto.exception.status_code, 400)
