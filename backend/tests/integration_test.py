import os
import sys
import time
import uuid
import random
from datetime import date

from fastapi.testclient import TestClient

# Ensure app package is importable
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.main import app


class DummyFastMail:
    def __init__(self, conf):
        self.sent = []

    def send_message(self, message):
        print("[DummyFastMail] send_message called for:", getattr(message, "subject", "<no-subject>"))
        self.sent.append(message)


def run():
    # Patch FastMail used in routes to avoid real SMTP calls
    import app.routes.doacao as doa_routes
    import app.routes.pedidos as ped_routes

    doa_routes.FastMail = DummyFastMail
    ped_routes.FastMail = DummyFastMail

    client = TestClient(app)

    senha = "Aa1!senha"

    # 1) criar usuario generico (para criar ONG)
    unique = uuid.uuid4().hex[:8]

    cpf_admin = str(random.randint(10**10, 10**11 - 1))

    usuario_generico = {
        "nome_completo": "Admin Test",
        "data_nascimento": str(date(1990, 1, 1)),
        "cep": "12345678",
        "cpf": cpf_admin,
        "telefone": "11999999999",
        "email": f"admin+{unique}@example.com",
        "senha": senha,
        "funcao": "Genérico",
    }
    r = client.post("/usuario/generico", json=usuario_generico)
    assert r.status_code == 200, r.text
    admin = r.json()

    # login admin
    r = client.post("/auth/login", json={"email": admin["email"], "senha": senha})
    assert r.status_code == 200, r.text
    token_admin = r.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    # 2) criar ONG
    ong_payload = {
        "nome": "ONG Test",
        "cnpj": str(random.randint(10**13, 10**14 - 1)),
        "rua": "Rua A",
        "numero": "100",
        "bairro": "Centro",
        "cidade": "Cidade",
        "estado": "SP",
        "cep": "12345678",
        "telefone": "11999999000",
        "email": "contato@ongtest.org",
        "sobre": "Organização de teste que recebe doações e realiza triagem de materiais.",
        "diasFuncionamento": [1, 2, 3],
        "horarioInicio": "08:00:00",
        "horarioFim": "17:00:00",
    }
    r = client.post("/ong/cadastro-ong", json=ong_payload, headers=headers_admin)
    if r.status_code == 200:
        ong = r.json()
    else:
        # se falhou por CNPJ duplicado, busca direto no DB para reutilizar a ONG existente
        from app.database.connection import Session, engine
        from app.models.ong import Ong

        with Session(engine) as session:
            ong_obj = session.query(Ong).filter(Ong.cnpj == ong_payload["cnpj"]).first()
            if not ong_obj:
                raise AssertionError(f"Falha ao criar ONG e não foi possível localizar existente: {r.text}")
            # serializar campos mínimos esperados
            ong = {
                "id": ong_obj.id,
                "cnpj": ong_obj.cnpj,
                "nome": ong_obj.nome,
            }

    # tentar gerar token de convite para voluntários da ONG (pode falhar se ONG já existir)
    token_ong = None
    r_token = client.post(f"/ong/gerar-token-ong/{ong['id']}", headers=headers_admin)
    if r_token.status_code == 200:
        token_ong = r_token.json()["token"]

    # 3) criar doador
    cpf_doador = str(random.randint(10**10, 10**11 - 1))

    doador_payload = {
        "nome_completo": "Doador Test",
        "data_nascimento": str(date(1990, 2, 2)),
        "cep": "87654321",
        "cpf": cpf_doador,
        "telefone": "11988888888",
        "email": f"doador+{unique}@example.com",
        "senha": senha,
        "funcao": "Doador",
    }
    r = client.post("/usuario/generico", json=doador_payload)
    assert r.status_code == 200, r.text
    doador = r.json()

    r = client.post("/auth/login", json={"email": doador["email"], "senha": senha})
    assert r.status_code == 200, r.text
    token_doador = r.json()["access_token"]
    headers_doador = {"Authorization": f"Bearer {token_doador}"}

    # 4) criar voluntario triagem
    cpf_triagem = str(random.randint(10**10, 10**11 - 1))

    triagem_payload = {
        "nome_completo": "Triagem Test",
        "data_nascimento": str(date(1990, 3, 3)),
        "cep": "11122233",
        "cpf": cpf_triagem,
        "telefone": "11977777777",
        "email": f"triagem+{unique}@example.com",
        "senha": senha,
        "funcao": "Voluntário da triagem",
        "token_convite": token_ong,
    }
    r = client.post("/usuario/generico", json=triagem_payload)
    assert r.status_code == 200, r.text
    triagem = r.json()

    r = client.post("/auth/login", json={"email": triagem["email"], "senha": senha})
    assert r.status_code == 200, r.text
    token_triagem = r.json()["access_token"]
    headers_triagem = {"Authorization": f"Bearer {token_triagem}"}

    # se não obtivemos token de convite, vincular o voluntário à ONG diretamente no DB
    if token_ong is None:
        from app.database.connection import Session, engine
        from app.models.ong import VoluntarioOng
        from app.models.user import UsuarioFuncao
        from app.core.enums import TipoUsuario

        with Session(engine) as session:
            vinc = VoluntarioOng(usuario_id=triagem["id"], ong_id=ong["id"])
            func = UsuarioFuncao(usuario_id=triagem["id"], tipo_usuario=TipoUsuario.TRIAGEM)
            session.add(vinc)
            session.add(func)
            session.commit()

    from app.database.connection import Session, engine
    from app.models.ong import VoluntarioOng

    with Session(engine) as session:
        vinculo = (
            session.query(VoluntarioOng)
            .filter(VoluntarioOng.usuario_id == triagem["id"], VoluntarioOng.ong_id == ong["id"])
            .first()
        )
        if vinculo:
            vinculo.nivel_confianca = 10
            session.commit()

    # 5) criar doação via JSON (sem upload)
    itens = [
        {
            "tipo_material": "Roupa",
            "descricao": "Camisas semi-novas",
            "possiveis_defeitos": "Pequenos furos",
            "quantidade": 5,
            "fotos": [
                {
                    "url": "https://example.test/foto1.jpg",
                    "nome_original": "foto1.jpg",
                    "content_type": "image/jpeg",
                    "tamanho_bytes": 1024,
                }
            ],
        }
    ]

    doacao_payload = {"ong_id": ong["id"], "observacao_doador": "Teste", "itens": itens}
    r = client.post("/doacoes", json=doacao_payload, headers=headers_doador)
    assert r.status_code == 201, r.text
    doacao = r.json()
    print("Doacao criada:", doacao["id"])

    item = doacao["itens"][0]
    item_id = item["id"]

    # 6) avaliar item como PRE_APROVADO (triagem) -> deve agendar e-mail
    avaliacao_payload = {"resultado": "PRE_APROVADO", "checklist": {}, "comentario": "ok"}
    r = client.post(f"/doacoes/itens/{item_id}/avaliacoes", json=avaliacao_payload, headers=headers_triagem)
    assert r.status_code == 200, r.text
    avaliacao = r.json()
    print("Avaliacao registrada:", avaliacao["id"], "resultado:", avaliacao["resultado"])

    # wait briefly for background task
    time.sleep(0.5)

    # 7) marcar como DISPONIVEL (recebido fisicamente)
    status_payload = {"status": "DISPONIVEL"}
    r = client.patch(f"/doacoes/itens/{item_id}/status", json=status_payload, headers=headers_triagem)
    assert r.status_code == 200, r.text
    item_after = r.json()
    assert item_after["status"] == "DISPONIVEL"
    assert item_after.get("disponivel_em") is not None
    print("Item disponibilizado em:", item_after.get("disponivel_em"))

    print("Integração UC04 básica executada com sucesso.")

    # ------ UC07: Pedido de Materiais ------
    # 1) criar usuário responsável
    cpf_responsavel = str(random.randint(10**10, 10**11 - 1))
    responsavel_payload = {
        "nome_completo": "Responsavel Test",
        "data_nascimento": str(date(1990, 4, 4)),
        "cep": "22233344",
        "cpf": cpf_responsavel,
        "telefone": "11966666666",
        "email": f"responsavel+{unique}@example.com",
        "senha": senha,
        "funcao": "Responsável pelo beneficiário",
    }

    r = client.post("/usuario/generico", json=responsavel_payload)
    assert r.status_code == 200, r.text
    responsavel = r.json()

    r = client.post("/auth/login", json={"email": responsavel["email"], "senha": senha})
    assert r.status_code == 200, r.text
    token_responsavel = r.json()["access_token"]
    headers_responsavel = {"Authorization": f"Bearer {token_responsavel}"}

    # Garantir que exista o registro UsuarioResponsavel (algumas rotas esperam essa tabela)
    from app.database.connection import Session, engine
    from app.models.user import UsuarioResponsavel
    from app.core.enums import BeneficiosUsuario

    with Session(engine) as sess:
        existing = sess.query(UsuarioResponsavel).filter(UsuarioResponsavel.responsavel_id == responsavel["id"]).first()
        if not existing:
            novo = UsuarioResponsavel(
                responsavel_id=responsavel["id"],
                qtd_familiares=0,
                renda=0.0,
                auxilio=BeneficiosUsuario.NENHUM,
                concordou_termos=True,
                ativo=True,
            )
            sess.add(novo)
            sess.commit()
        usuario_responsavel_id = existing.id if existing else novo.id

    # 2) cadastrar familiar (beneficiário) para este responsável
    import json as _json

    familia_payload = [
        {
            "nome": "Beneficiado Test",
            "cpf": str(random.randint(10**10, 10**11 - 1)),
            "parentesco": "Filho",
            "data_nascimento": str(date(2015, 1, 1)),
            "renda": 0.0,
            "beneficiario": True,
        }
    ]

    r = client.post(
        f"/usuario/{usuario_responsavel_id}/familia-responsavel",
        data={"dados_familiares": _json.dumps(familia_payload)},
        headers=headers_responsavel,
    )
    assert r.status_code == 200, r.text
    familiares = r.json()
    familiar_id = familiares[0]["id"]

    # 3) criar pedido pelo responsável para material disponível (usar tipo_material do item criado)
    pedido_payload = {
        "ong_id": ong["id"],
        "familiar_id": familiar_id,
        "itens": [{"tipo_material": item_after["tipo_material"], "quantidade": 1}],
    }

    r = client.post("/pedidos/", json=pedido_payload, headers=headers_responsavel)
    assert r.status_code == 201, r.text
    pedido = r.json()
    print("Pedido criado:", pedido["id"])

    pedido_item = pedido["itens"][0]

    # 4) ONG aprova item do pedido (triagem usuário)
    r = client.patch(
        f"/pedidos/itens/{pedido_item['id']}/status",
        json={"status": "AGUARDANDO_RETIRADA"},
        headers=headers_triagem,
    )
    assert r.status_code == 200, r.text
    item_aprovado = r.json()
    assert item_aprovado["status"] == "AGUARDANDO_RETIRADA"
    print("Item aprovado, codigo_coleta on pedido:", pedido.get("codigo_coleta"))

    # 5) ONG registra coleta (triagem marca MATERIAL_COLETADO)
    r = client.patch(
        f"/pedidos/itens/{pedido_item['id']}/status",
        json={"status": "MATERIAL_COLETADO"},
        headers=headers_triagem,
    )
    assert r.status_code == 200, r.text
    item_coletado = r.json()
    assert item_coletado["status"] == "MATERIAL_COLETADO"

    print("UC07 fluxo de pedido executado com sucesso.")

    # ------ Painel do coordenador: pendências ------
    itens_painel_doacao = [
        {
            "tipo_material": "Cobertor",
            "descricao": "Cobertores em bom estado",
            "possiveis_defeitos": None,
            "quantidade": 2,
            "fotos": [
                {
                    "url": "https://example.test/foto-painel-doacao.jpg",
                    "nome_original": "foto-painel-doacao.jpg",
                    "content_type": "image/jpeg",
                    "tamanho_bytes": 1024,
                }
            ],
        }
    ]
    r = client.post(
        "/doacoes",
        json={"ong_id": ong["id"], "observacao_doador": "Painel", "itens": itens_painel_doacao},
        headers=headers_doador,
    )
    assert r.status_code == 201, r.text
    doacao_painel = r.json()
    painel_item_doacao = doacao_painel["itens"][0]

    r = client.post(
        f"/doacoes/itens/{painel_item_doacao['id']}/avaliacoes",
        json={"resultado": "PRE_APROVADO", "checklist": {}, "comentario": "ok"},
        headers=headers_triagem,
    )
    assert r.status_code == 200, r.text

    itens_painel_disponivel = [
        {
            "tipo_material": "Manta",
            "descricao": "Mantas em bom estado",
            "possiveis_defeitos": None,
            "quantidade": 3,
            "fotos": [
                {
                    "url": "https://example.test/foto-painel-disponivel.jpg",
                    "nome_original": "foto-painel-disponivel.jpg",
                    "content_type": "image/jpeg",
                    "tamanho_bytes": 1024,
                }
            ],
        }
    ]
    r = client.post(
        "/doacoes",
        json={"ong_id": ong["id"], "observacao_doador": "Painel disponível", "itens": itens_painel_disponivel},
        headers=headers_doador,
    )
    assert r.status_code == 201, r.text
    doacao_disponivel = r.json()
    item_disponivel = doacao_disponivel["itens"][0]

    r = client.post(
        f"/doacoes/itens/{item_disponivel['id']}/avaliacoes",
        json={"resultado": "PRE_APROVADO", "checklist": {}, "comentario": "ok"},
        headers=headers_triagem,
    )
    assert r.status_code == 200, r.text

    r = client.patch(
        f"/doacoes/itens/{item_disponivel['id']}/status",
        json={"status": "DISPONIVEL"},
        headers=headers_triagem,
    )
    assert r.status_code == 200, r.text

    pedido_painel_payload = {
        "ong_id": ong["id"],
        "familiar_id": familiar_id,
        "itens": [{"tipo_material": "Manta", "quantidade": 1}],
    }
    r = client.post("/pedidos/", json=pedido_painel_payload, headers=headers_responsavel)
    assert r.status_code == 201, r.text
    pedido_painel = r.json()

    pedido_painel_item = pedido_painel["itens"][0]
    r = client.patch(
        f"/pedidos/itens/{pedido_painel_item['id']}/status",
        json={"status": "AGUARDANDO_RETIRADA"},
        headers=headers_triagem,
    )
    assert r.status_code == 200, r.text

    r = client.get("/ong/minha-ong/pendencias", headers=headers_admin)
    assert r.status_code == 200, r.text
    painel = r.json()

    assert painel["ong_id"] == ong["id"]
    assert any(doacao["id"] == doacao_painel["id"] for doacao in painel["doacoes_pre_aprovadas"])
    assert any(pedido["id"] == pedido_painel["id"] for pedido in painel["pedidos_aguardando_retirada"])

    r = client.get("/ong/minha-ong/pendencias", headers=headers_triagem)
    assert r.status_code == 200, r.text
    painel_triagem = r.json()

    assert painel_triagem["ong_id"] == ong["id"]
    assert any(doacao["id"] == doacao_painel["id"] for doacao in painel_triagem["doacoes_pre_aprovadas"])
    assert any(pedido["id"] == pedido_painel["id"] for pedido in painel_triagem["pedidos_aguardando_retirada"])

if __name__ == "__main__":
    run()
