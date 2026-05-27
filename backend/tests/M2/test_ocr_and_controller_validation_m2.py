import unittest

from fastapi import HTTPException
from pydantic import ValidationError

from base import DescriptiveTestCaseMixin, M2ServiceTestCase
from app.models.doacao import MAX_TAMANHO_FOTO_DOACAO_BYTES
from app.routes import demo_files, doacao
from app.schemas.doacao import CriarFotoItemDoacao
from app.services.ocr_documento import OcrDocumentoService


class DummyDocumento:
    def __init__(self, filename: str, content_type: str):
        self.filename = filename
        self.content_type = content_type


class DummyUpload:
    def __init__(self, data: bytes, filename: str = "foto.jpg"):
        self.data = data
        self.filename = filename

    async def read(self):
        return self.data

    async def seek(self, pos: int):
        return None


class OcrDocumentoServiceM2Test(M2ServiceTestCase):
    def test_ocr_extrai_cpf_nome_e_compara_com_cadastro(self):
        texto = """
        REPUBLICA FEDERATIVA DO BRASIL
        NOME COMPLETO: MARIA EDUARDA SANTOS
        CPF 123.456.789-09
        """

        dados = OcrDocumentoService.extrair_dados_identidade(texto)
        comparacao = OcrDocumentoService.comparar_com_cadastro(
            dados_extraidos={
                **dados,
                "salario_beneficio": 1500.0,
            },
            nome_completo="Maria Eduarda Santos",
            cpf="12345678909",
            salario_beneficio=1500.0,
        )

        self.assertEqual(dados["cpf"], "123.456.789-09")
        self.assertEqual(dados["nome_completo"], "Maria Eduarda Santos")
        self.assertTrue(comparacao["aprovado"])

    def test_ocr_extrai_valor_de_renda_em_formato_brasileiro(self):
        texto = """
        HOLERITE
        FUNCIONARIO: JOAO CARLOS PEREIRA
        TOTAL PROVENTOS R$ 2.468,02
        DESCONTOS R$ 100,00
        """

        dados = OcrDocumentoService.extrair_dados_comprovante_renda(
            texto,
            valor_referencia=2468.02,
        )

        self.assertEqual(dados["nome_completo"], "Joao Carlos Pereira")
        self.assertEqual(dados["salario_beneficio"], 2468.02)

    def test_comparacao_reprova_cpf_ou_nome_divergente(self):
        comparacao = OcrDocumentoService.comparar_com_cadastro(
            dados_extraidos={
                "cpf": "000.000.000-00",
                "nome_completo": "Outra Pessoa",
                "salario_beneficio": 1200.0,
            },
            nome_completo="Maria Eduarda Santos",
            cpf="12345678909",
            salario_beneficio=1200.0,
        )

        self.assertFalse(comparacao["aprovado"])
        self.assertFalse(comparacao["campos"]["cpf"]["confere"])
        self.assertFalse(comparacao["campos"]["nome_completo"]["confere"])

    def test_foto_de_doacao_nao_pode_passar_de_dez_mb(self):
        with self.assertRaises(ValidationError):
            CriarFotoItemDoacao(
                url="https://storage.test/grande.jpg",
                nome_original="grande.jpg",
                content_type="image/jpeg",
                tamanho_bytes=MAX_TAMANHO_FOTO_DOACAO_BYTES + 1,
            )

    def test_parse_salario_beneficio_aceita_formato_brasileiro_e_decimal(self):
        self.assertEqual(demo_files._parse_salario_beneficio("2.468,02"), 2468.02)
        self.assertEqual(demo_files._parse_salario_beneficio("2468.02"), 2468.02)

        with self.assertRaises(HTTPException) as contexto:
            demo_files._parse_salario_beneficio("valor invalido")

        self.assertEqual(contexto.exception.status_code, 422)

    def test_validacao_de_arquivo_aceita_imagem_ou_pdf_e_rejeita_outros_tipos(self):
        self.assertFalse(
            demo_files._validar_arquivo_documento(
                DummyDocumento("identidade.jpg", "image/jpeg"),
                "identidade",
            )
        )
        self.assertTrue(
            demo_files._validar_arquivo_documento(
                DummyDocumento("renda.pdf", "application/pdf"),
                "comprovante_renda",
            )
        )

        with self.assertRaises(HTTPException) as contexto:
            demo_files._validar_arquivo_documento(
                DummyDocumento("script.exe", "application/octet-stream"),
                "identidade",
            )

        self.assertEqual(contexto.exception.status_code, 400)

    def test_parse_itens_formulario_rejeita_indices_repetidos(self):
        payload = """
        [
          {
            "tipo_material": "Caderno",
            "descricao": "Caderno em bom estado",
            "quantidade": 2,
            "fotos_indices": [0, 0]
          }
        ]
        """

        with self.assertRaises(HTTPException) as contexto:
            doacao._parse_itens_formulario(payload)

        self.assertEqual(contexto.exception.status_code, 400)


class UploadValidationM2Test(DescriptiveTestCaseMixin, unittest.IsolatedAsyncioTestCase):
    async def test_validar_tamanho_upload_rejeita_arquivo_vazio(self):
        with self.assertRaises(HTTPException) as contexto:
            await doacao._validar_tamanho_upload(DummyUpload(b"", "vazio.jpg"))

        self.assertEqual(contexto.exception.status_code, 400)

    async def test_validar_tamanho_upload_rejeita_arquivo_maior_que_limite(self):
        grande = b"x" * (MAX_TAMANHO_FOTO_DOACAO_BYTES + 1)

        with self.assertRaises(HTTPException) as contexto:
            await doacao._validar_tamanho_upload(DummyUpload(grande, "grande.jpg"))

        self.assertEqual(contexto.exception.status_code, 400)

    async def test_validar_tamanho_upload_retorna_tamanho_para_arquivo_valido(self):
        tamanho = await doacao._validar_tamanho_upload(DummyUpload(b"abc", "ok.jpg"))

        self.assertEqual(tamanho, 3)
