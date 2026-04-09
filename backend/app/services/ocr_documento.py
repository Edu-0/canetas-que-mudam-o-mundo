import os
import re
import unicodedata
from difflib import SequenceMatcher
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image


class OcrDocumentoService:
    @staticmethod
    def extrair_texto_bruto(file_bytes: bytes, is_pdf: bool = False) -> str:
        """Executa OCR com PaddleOCR e retorna o texto bruto concatenado."""
        # Evita falhas conhecidas no backend oneDNN/PIR em alguns ambientes Windows + CPU.
        os.environ.setdefault("FLAGS_use_mkldnn", "0")

        try:
            from paddleocr import PaddleOCR
        except Exception as exc:
            raise RuntimeError(
                "PaddleOCR não está disponível. Instale as dependências de OCR no backend."
            ) from exc

        if is_pdf:
            imagem = OcrDocumentoService._pdf_primeira_pagina_para_imagem(file_bytes)
        else:
            imagem = Image.open(BytesIO(file_bytes)).convert("RGB")

        imagem_np = np.array(imagem)

        try:
            ocr = PaddleOCR(use_angle_cls=True, lang="pt", enable_mkldnn=False)
        except TypeError:
            # Compatibilidade com versões mais novas que mudaram a API.
            ocr = PaddleOCR(lang="pt", enable_mkldnn=False)

        try:
            resultado = ocr.ocr(imagem_np, cls=True)
        except TypeError:
            try:
                resultado = ocr.ocr(imagem_np)
            except TypeError:
                resultado = ocr.predict(imagem_np)

        if not resultado:
            return ""

        linhas = OcrDocumentoService._coletar_textos(resultado)

        return "\n".join(linhas)

    @staticmethod
    def _pdf_primeira_pagina_para_imagem(file_bytes: bytes) -> Image.Image:
        try:
            import pypdfium2 as pdfium
        except Exception as exc:
            raise RuntimeError(
                "Suporte a PDF não está disponível. Instale a dependência pypdfium2."
            ) from exc

        try:
            pdf = pdfium.PdfDocument(file_bytes)
            if len(pdf) == 0:
                raise RuntimeError("PDF sem páginas para OCR.")

            page = pdf[0]
            bitmap = page.render(scale=2.0)
            imagem = bitmap.to_pil().convert("RGB")

            page.close()
            pdf.close()
            return imagem
        except Exception as exc:
            raise RuntimeError(f"Falha ao converter PDF para imagem: {exc}") from exc

    @staticmethod
    def _coletar_textos(resultado: Any) -> list[str]:
        """Extrai textos de formatos de retorno antigos e novos do PaddleOCR."""
        textos: list[str] = []

        def visitar(valor: Any):
            if valor is None:
                return

            if isinstance(valor, dict):
                for chave in ("rec_text", "text"):
                    item = valor.get(chave)
                    if isinstance(item, str) and item.strip():
                        textos.append(item.strip())

                rec_texts = valor.get("rec_texts")
                if isinstance(rec_texts, list):
                    for item in rec_texts:
                        if isinstance(item, str) and item.strip():
                            textos.append(item.strip())

                for subvalor in valor.values():
                    visitar(subvalor)
                return

            if isinstance(valor, (list, tuple)):
                # Formato clássico: [bbox, [texto, score]]
                if len(valor) >= 2 and isinstance(valor[1], (list, tuple)) and valor[1]:
                    possivel_texto = valor[1][0]
                    if isinstance(possivel_texto, str) and possivel_texto.strip():
                        textos.append(possivel_texto.strip())

                for item in valor:
                    visitar(item)

        visitar(resultado)

        # Remove duplicados preservando ordem.
        return list(dict.fromkeys(textos))

    @staticmethod
    def extrair_dados_chave(texto_bruto: str) -> dict[str, Any]:
        cpf = OcrDocumentoService._extrair_cpf(texto_bruto)
        nome = OcrDocumentoService._extrair_nome(texto_bruto)
        salario_beneficio = OcrDocumentoService._extrair_valor_monetario(texto_bruto)

        return {
            "cpf": cpf,
            "nome_completo": nome,
            "salario_beneficio": salario_beneficio,
            "texto_bruto": texto_bruto,
        }

    @staticmethod
    def extrair_cpf_identidade(texto_bruto: str) -> str | None:
        return OcrDocumentoService._extrair_cpf(texto_bruto)

    @staticmethod
    def extrair_dados_identidade(texto_bruto: str) -> dict[str, Any]:
        cpf = OcrDocumentoService._extrair_cpf(texto_bruto)
        nome = OcrDocumentoService._extrair_nome(texto_bruto)

        return {
            "cpf": cpf,
            "nome_completo": nome,
            "texto_bruto": texto_bruto,
        }

    @staticmethod
    def extrair_dados_comprovante_renda(
        texto_bruto: str,
        valor_referencia: float | None = None,
    ) -> dict[str, Any]:
        nome = OcrDocumentoService._extrair_nome(texto_bruto)
        salario_beneficio = OcrDocumentoService._extrair_valor_monetario(
            texto_bruto,
            valor_referencia=valor_referencia,
        )

        return {
            "nome_completo": nome,
            "salario_beneficio": salario_beneficio,
            "texto_bruto": texto_bruto,
        }

    @staticmethod
    def comparar_com_cadastro(
        dados_extraidos: dict[str, Any],
        nome_completo: str,
        cpf: str,
        salario_beneficio: float,
    ) -> dict[str, Any]:
        cpf_extraido = OcrDocumentoService._somente_digitos(dados_extraidos.get("cpf") or "")
        cpf_enviado = OcrDocumentoService._somente_digitos(cpf)
        cpf_confere = cpf_extraido != "" and cpf_extraido == cpf_enviado

        nome_extraido = dados_extraidos.get("nome_completo") or ""
        score_nome = OcrDocumentoService._similaridade_nome(nome_extraido, nome_completo)
        nome_confere = score_nome >= 0.8

        valor_extraido = dados_extraidos.get("salario_beneficio")
        valor_confere = False
        if valor_extraido is not None:
            valor_confere = abs(float(valor_extraido) - float(salario_beneficio)) <= 0.05

        campos = {
            "cpf": {
                "enviado": cpf_enviado,
                "extraido": cpf_extraido or None,
                "confere": cpf_confere,
            },
            "nome_completo": {
                "enviado": nome_completo,
                "extraido": nome_extraido or None,
                "score": round(score_nome, 4),
                "confere": nome_confere,
            },
            "salario_beneficio": {
                "enviado": float(salario_beneficio),
                "extraido": valor_extraido,
                "confere": valor_confere,
            },
        }

        aprovado = cpf_confere and nome_confere and valor_confere

        return {
            "aprovado": aprovado,
            "campos": campos,
        }

    @staticmethod
    def _extrair_cpf(texto: str) -> str | None:
        match = re.search(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b", texto)
        return match.group(0) if match else None

    @staticmethod
    def _extrair_nome(texto: str) -> str | None:
        linhas = [linha.strip() for linha in texto.splitlines() if linha.strip()]
        if not linhas:
            return None

        texto_norm = OcrDocumentoService._normalizar_texto(texto)

        # 1) Prioridade para padrões explícitos com rótulo + valor na mesma linha.
        padroes_rotulo = [
            r"(?:NOME\s+DO\s+FUNCIONARIO|NOME\s+FUNCIONARIO|FUNCIONARIO|NOME\s+COMPLETO|NOME|BENEFICIARIO|TITULAR)\s*[:\-]\s*([A-Z\s]{5,})",
        ]

        for padrao in padroes_rotulo:
            match = re.search(padrao, texto_norm)
            if match:
                candidato = match.group(1).strip()
                if OcrDocumentoService._linha_parece_nome(candidato):
                    return candidato.title()

        # 2) Se o rótulo vier sozinho, usa a próxima linha como candidato.
        rotulos_nome = (
            "NOME DO FUNCIONARIO",
            "NOME FUNCIONARIO",
            "FUNCIONARIO",
            "NOME COMPLETO",
            "NOME",
            "BENEFICIARIO",
            "TITULAR",
        )

        for idx, linha in enumerate(linhas):
            linha_norm = OcrDocumentoService._normalizar_texto(linha)
            if any(rotulo in linha_norm for rotulo in rotulos_nome):
                # Tenta extrair valor na mesma linha depois de : ou -
                partes = re.split(r"[:\-]", linha, maxsplit=1)
                if len(partes) == 2:
                    candidato = OcrDocumentoService._limpar_prefixo_codigo_nome(partes[1].strip())
                    if OcrDocumentoService._linha_parece_nome(candidato):
                        return candidato.title()

                # Se não houver valor na mesma linha, tenta a próxima.
                if idx + 1 < len(linhas):
                    proxima = OcrDocumentoService._limpar_prefixo_codigo_nome(linhas[idx + 1].strip())
                    if OcrDocumentoService._linha_parece_nome(proxima):
                        return proxima.title()

        # 3) Fallback: primeira linha que pareça nome humano e não campo financeiro.
        for linha in linhas:
            if OcrDocumentoService._linha_parece_nome(linha):
                return linha.title()

        return None

    @staticmethod
    def _limpar_prefixo_codigo_nome(linha: str) -> str:
        # Ex.: "5564 Jose Silva" -> "Jose Silva"
        return re.sub(r"^\d{2,}\s+", "", (linha or "").strip())

    @staticmethod
    def _linha_parece_nome(linha: str) -> bool:
        if not linha:
            return False

        linha = OcrDocumentoService._limpar_prefixo_codigo_nome(linha)
        linha_norm = OcrDocumentoService._normalizar_texto(linha)

        if len(linha_norm.split()) < 2:
            return False

        if re.search(r"\d", linha_norm):
            return False

        termos_bloqueados = {
            "SALARIO",
            "BASE",
            "NOME",
            "NOMEDO",
            "FUNCIONARIO",
            "REMUNERACAO",
            "RENDA",
            "BENEFICIO",
            "PROVENTOS",
            "DESCONTOS",
            "LIQUIDO",
            "TOTAL",
            "VALOR",
            "REFERENCIA",
            "MATRICULA",
            "CARGO",
            "FUNCAO",
            "EMPRESA",
            "CNPJ",
            "CPF",
            "RG",
            "INSS",
            "IRRF",
            "FGTS",
        }

        tokens = set(re.findall(r"[A-Z]+", linha_norm))
        if tokens & termos_bloqueados:
            return False

        return re.fullmatch(r"[A-Za-zÀ-ÿ\s]{6,}", linha) is not None

    @staticmethod
    def _extrair_valor_monetario(
        texto: str,
        valor_referencia: float | None = None,
    ) -> float | None:
        texto_norm = OcrDocumentoService._normalizar_texto(texto)

        candidatos: list[tuple[float, float]] = []
        linhas = [linha.strip() for linha in texto_norm.splitlines() if linha.strip()]

        padrao_valor = re.compile(
            r"(?:R\$\s*)?(\d{1,3}(?:[\.\s]\d{3})*(?:[\.,]\d{2})|\d+[\.,]\d{2})"
        )

        palavras_chave_valor = (
            "TOTAL PROVENTOS",
            "TOTAL DOS VENCIMENTOS",
            "SALARIO BASE",
            "REMUNERACAO",
            "RENDA",
            "BENEFICIO",
            "PROVENTOS",
        )

        palavras_ignorar_linha = (
            "CNPJ",
            "CPF",
            "DATA",
            "PERIODO",
            "MES",
            "ANO",
            "CBO",
            "COD",
        )

        for linha in linhas:
            if any(token in linha for token in palavras_ignorar_linha):
                continue

            prioridade = 1.0
            if any(token in linha for token in palavras_chave_valor):
                prioridade = 4.0
            elif "R$" in linha:
                prioridade = 2.5

            for match in padrao_valor.finditer(linha):
                _, fim = match.span(1)
                valor_str = match.group(1)

                sufixo = linha[fim:fim + 2]
                if "%" in sufixo:
                    continue

                valor = OcrDocumentoService._parse_valor_brl(valor_str)
                if valor is None:
                    continue

                # Elimina outliers comuns de documento para renda mensal.
                if valor < 50 or valor > 99999:
                    continue

                candidatos.append((valor, prioridade))

        if not candidatos:
            return None

        if valor_referencia is not None:
            melhor_valor, _ = min(
                candidatos,
                key=lambda item: (abs(item[0] - float(valor_referencia)) - item[1] * 0.01),
            )
            return melhor_valor

        # Sem referência, prioriza maior relevância e depois maior valor.
        melhor_valor, _ = max(candidatos, key=lambda item: (item[1], item[0]))
        return melhor_valor

    @staticmethod
    def _parse_valor_brl(valor_str: str) -> float | None:
        valor_limpo = re.sub(r"\s+", "", (valor_str or "")).strip()
        if not valor_limpo:
            return None

        if "," in valor_limpo and "." in valor_limpo:
            # Assume separador decimal pelo último símbolo.
            if valor_limpo.rfind(",") > valor_limpo.rfind("."):
                # Ex.: 2.750,00
                valor_limpo = valor_limpo.replace(".", "").replace(",", ".")
            else:
                # Ex.: 2,750.00
                valor_limpo = valor_limpo.replace(",", "")
        elif "," in valor_limpo:
            # Ex.: 2750,00
            valor_limpo = valor_limpo.replace(",", ".")
        elif valor_limpo.count(".") > 1:
            # Ex.: 2.309.70 -> 2309.70
            partes = valor_limpo.split(".")
            valor_limpo = "".join(partes[:-1]) + "." + partes[-1]

        try:
            return float(valor_limpo)
        except ValueError:
            return None

    @staticmethod
    def _somente_digitos(valor: str) -> str:
        return re.sub(r"\D", "", valor or "")

    @staticmethod
    def _normalizar_texto(valor: str) -> str:
        sem_acentos = "".join(
            c
            for c in unicodedata.normalize("NFD", valor)
            if unicodedata.category(c) != "Mn"
        )
        return sem_acentos.upper()

    @staticmethod
    def _similaridade_nome(nome_ocr: str, nome_cadastro: str) -> float:
        nome_ocr_norm = OcrDocumentoService._normalizar_texto(nome_ocr).strip()
        nome_cadastro_norm = OcrDocumentoService._normalizar_texto(nome_cadastro).strip()

        if not nome_ocr_norm or not nome_cadastro_norm:
            return 0.0

        return SequenceMatcher(None, nome_ocr_norm, nome_cadastro_norm).ratio()