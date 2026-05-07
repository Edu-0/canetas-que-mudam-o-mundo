import hashlib
import logging
import uuid
from datetime import date, datetime

from fastapi import HTTPException

from app.core.enums import BeneficiosUsuario, TipoUsuario
from app.core.firebase import get_bucket
from app.core.security import gerar_hash_senha
from app.database.connection import SessionDep
from app.models import user as m
from app.services.firebase_storage import FirebaseStorageService
from app.utils.funcoes import gerar_codigo_numerico, gerar_email_anonimo


# As conversões para hash e aleatoriedade servem para manter a privacidades dos dados e conformidade com a LGPD, garantindo que as informações originais não possam ser recuperadas.


def obter_caminho_storage(file_url: str) -> str: # Extrai o caminho do arquivo a partir da URL completa, considerando o nome do bucket para garantir compatibilidade com diferentes configurações de Firebase Storage.
    bucket = get_bucket()
    bucket_name = bucket.name
    return file_url.split(f"/{bucket_name}/")[-1]


def preparar_backup_arquivos(urls: list[str]) -> list[dict[str, str | bytes]]: # Faz o download dos arquivos do Firebase Storage e armazena em memória para permitir restauração em caso de falha durante o processo de anonimização, garantindo que os dados possam ser recuperados se necessário. (Requisitos para que db.rollback() funcione corretamente como dito no Jira.)
    backups: list[dict[str, str | bytes]] = []
    bucket = get_bucket()
    urls_unicas = list(dict.fromkeys(urls)) # Remove URLs duplicadas para evitar downloads redundantes, otimizando o processo de backup e reduzindo o tempo de execução, especialmente para usuários com muitos documentos.

    for url in urls_unicas:
        caminho = obter_caminho_storage(url)
        blob = bucket.blob(caminho)

        if not blob.exists(): # Verifica se o arquivo existe antes de tentar fazer o download, garantindo que o processo de backup seja robusto e evitando falhas inesperadas caso um arquivo tenha sido removido ou movido no Firebase Storage.
            raise HTTPException(
                status_code=404,
                detail=f"Arquivo não encontrado no Firebase Storage: {url}"
            )

        backups.append({ # Armazena o caminho, conteúdo e tipo do arquivo para permitir restauração completa em caso de falha, garantindo que os arquivos possam ser recuperados com suas informações originais intactas.
            "caminho": caminho,
            "conteudo": blob.download_as_bytes(),
            "content_type": blob.content_type or "application/octet-stream",
        })

    return backups


def restaurar_arquivos_no_storage(backups: list[dict[str, str | bytes]]) -> None: # Restaura os arquivos no Firebase Storage usando os dados armazenados em memória, garantindo que os arquivos possam ser recuperados com suas informações originais intactas em caso de falha durante o processo de anonimização, mantendo a integridade dos dados e a conformidade com a LGPD.
    for backup in backups:
        FirebaseStorageService.upload_bytes(
            backup["conteudo"],
            backup["caminho"],
            backup["content_type"]
        )


def anonimizar_usuario(usuario: m.Usuario) -> None: # Anonimiza as informações do usuário, mantendo a integridade dos dados e a conformidade com a LGPD.
    usuario.nome_completo = "Usuário Anonimizado"
    usuario.cpf = gerar_codigo_numerico(f"usuario:{usuario.id}:cpf", 11)
    usuario.telefone = gerar_codigo_numerico(f"usuario:{usuario.id}:telefone", 11)
    usuario.email = gerar_email_anonimo(usuario.id)
    usuario.cep = gerar_codigo_numerico(f"usuario:{usuario.id}:cep", 8)
    usuario.data_nascimento = date(usuario.data_nascimento.year, 1, 1)
    usuario.senha = gerar_hash_senha(str(uuid.uuid4()))
    usuario.ativo = False
    usuario.data_edicao_conta = datetime.now()


def anonimizar_responsavel_perfil(responsavel: m.UsuarioResponsavel) -> None: # Anonimiza as informações do perfil de responsável, mantendo a integridade dos dados e a conformidade com a LGPD.
    responsavel.qtd_familiares = 0
    responsavel.renda = 0.0
    responsavel.auxilio = BeneficiosUsuario.NENHUM
    responsavel.concordou_termos = False
    responsavel.documentacao_aprovada = False
    responsavel.ativo = False
    responsavel.data_edicao_conta = datetime.now()


def anonimizar_familiar(familiar: m.FamiliaResponsavel) -> None: # Anonimiza as informações do familiar, mantendo a integridade dos dados e a conformidade com a LGPD.
    familiar.nome = "Familiar Anonimizado"
    familiar.cpf = gerar_codigo_numerico(f"familiar:{familiar.id}:cpf", 11)
    familiar.renda = 0.0
    familiar.beneficiario = False
    familiar.data_nascimento = date(familiar.data_nascimento.year, 1, 1)
    familiar.data_edicao = datetime.now()
    familiar.ativo = False


def remover_arquivos_do_storage(urls: list[str]) -> None:
    urls_unicas = list(dict.fromkeys(urls))

    for url in urls_unicas:
        try:
            FirebaseStorageService.delete_file(url)
        except Exception as e:
            logging.error(f"Erro ao apagar arquivo no Storage ({url}): {e}")
            raise HTTPException(
                status_code=400,
                detail="Não foi possível remover todos os arquivos do Firebase Storage. A exclusão foi cancelada."
            ) from e


def anonimizar_responsavel(usuario_id, db: SessionDep): # Função principal que orquestra o processo de anonimização do usuário, incluindo a preparação de backups dos arquivos, a anonimização dos dados e a remoção dos arquivos do Firebase Storage, garantindo que o processo seja robusto e que os dados possam ser restaurados em caso de falha, mantendo a integridade dos dados e a conformidade com a LGPD.
    usuario = db.get(m.Usuario, usuario_id)

    if not usuario: # Verifica se o usuário existe antes de iniciar o processo de anonimização.
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    responsavel = db.query(m.UsuarioResponsavel).filter(
        m.UsuarioResponsavel.responsavel_id == usuario_id
    ).first()

    familiares = []
    documentos_familia = []
    documentos_usuario = db.query(m.DocumentoUsuario).filter(
        m.DocumentoUsuario.responsavel_id == usuario_id
    ).all()

    if responsavel: # Verifica se o usuário tem um perfil de responsável associado.
        familiares = db.query(m.FamiliaResponsavel).filter(
            m.FamiliaResponsavel.responsavel_id == responsavel.id
        ).all()

        for familiar in familiares:
            documentos_familia.extend(
                db.query(m.DocumentoFamilia).filter(
                    m.DocumentoFamilia.familiar_id == familiar.id
                ).all()
            )

    # Preparando backup dos arquivos antes de remover do Storage para garantir que possam ser restaurados em caso de falha durante o processo de anonimização.
    urls_arquivos = [doc.caminho_arquivo for doc in documentos_usuario]
    urls_arquivos.extend(doc.caminho_arquivo for doc in documentos_familia)

    backups_arquivos = preparar_backup_arquivos(urls_arquivos)
    remover_arquivos_do_storage(urls_arquivos)

    try: # Inicia o processo de anonimização
        anonimizar_usuario(usuario)

        if responsavel:
            anonimizar_responsavel_perfil(responsavel)

            for familiar in familiares:
                anonimizar_familiar(familiar)

        for doc in documentos_usuario:
            db.delete(doc)

        for doc in documentos_familia:
            db.delete(doc)

        db.query(m.UsuarioFuncao).filter(
            m.UsuarioFuncao.usuario_id == usuario_id
        ).delete(synchronize_session=False)

        db.commit()
        db.refresh(usuario)

        if responsavel:
            db.refresh(responsavel)

        return {"mensagem": "Conta anonimizada com sucesso."}

    except Exception as e:
        db.rollback() # Rollback feito com os dados salvos antes da anonimização com o backup dos arquivos.
        try:
            restaurar_arquivos_no_storage(backups_arquivos)
        except Exception as erro_restauracao:
            logging.error(f"Erro ao restaurar arquivos após falha no banco: {erro_restauracao}")
            raise HTTPException(
                status_code=500,
                detail="A conta não foi anonimizada e não foi possível restaurar os arquivos removidos do Firebase Storage."
            ) from erro_restauracao
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao anonimizar a conta: {str(e)}"
        )

def remover_funcao_responsavel(usuario_id: int, db: SessionDep):
    usuario = db.get(m.Usuario, usuario_id)

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    responsavel = db.query(m.UsuarioResponsavel).filter(
        m.UsuarioResponsavel.responsavel_id == usuario_id
    ).first()

    if not responsavel:
        raise HTTPException(status_code=404, detail="Perfil de responsável não encontrado.")

    familiares = db.query(m.FamiliaResponsavel).filter(
        m.FamiliaResponsavel.responsavel_id == responsavel.id
    ).all()

    documentos_familia = []
    for familiar in familiares:
        documentos_familia.extend(
            db.query(m.DocumentoFamilia).filter(
                m.DocumentoFamilia.familiar_id == familiar.id
            ).all()
        )

    documentos_usuario = db.query(m.DocumentoUsuario).filter(
        m.DocumentoUsuario.responsavel_id == usuario_id
    ).all()

    urls_arquivos = [doc.caminho_arquivo for doc in documentos_usuario if doc.caminho_arquivo]
    urls_arquivos.extend(doc.caminho_arquivo for doc in documentos_familia if doc.caminho_arquivo)

    backups_arquivos = preparar_backup_arquivos(urls_arquivos) if urls_arquivos else []

    if urls_arquivos:
        remover_arquivos_do_storage(urls_arquivos)

    try:
        anonimizar_responsavel_perfil(responsavel)

        for familiar in familiares:
            anonimizar_familiar(familiar)

        for doc in documentos_usuario:
            db.delete(doc)

        for doc in documentos_familia:
            db.delete(doc)

        usuario.data_edicao_conta = datetime.now()
        db.commit()
        db.refresh(usuario)
        db.refresh(responsavel)

        return {"mensagem": "Função de responsável removida com sucesso."}

    except Exception as e:
        db.rollback()

        try:
            if backups_arquivos:
                restaurar_arquivos_no_storage(backups_arquivos)
        except Exception as erro_restauracao:
            logging.error(f"Erro ao restaurar arquivos após falha na remoção da função: {erro_restauracao}")
            raise HTTPException(
                status_code=500,
                detail="A função não foi removida e não foi possível restaurar os arquivos removidos do Firebase Storage."
            ) from erro_restauracao

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover a função de responsável: {str(e)}"
        )

def processar_exclusao_conta(usuario_id, db: SessionDep):
    
    funcoes_do_usuario = db.query(m.UsuarioFuncao).filter(m.UsuarioFuncao.usuario_id == usuario_id).all()
    tipos_cadastrados = [f.tipo_usuario for f in funcoes_do_usuario]

    db.query(m.UsuarioFuncao).filter(m.UsuarioFuncao.usuario_id == usuario_id).delete()

    if TipoUsuario.COORDENADOR_PROCESSOS in tipos_cadastrados:
        
        usuario_deletado = db.query(m.Usuario).filter(m.Usuario.id == usuario_id).delete()
    
        if usuario_deletado == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
            
    elif TipoUsuario.RESPONSAVEL_BENEFICIARIO in tipos_cadastrados:
        anonimizar_responsavel(usuario_id, db)
        
    else:
        usuario = db.query(m.Usuario).filter(m.Usuario.id == usuario_id).first()
        anonimizar_usuario(usuario)

    db.commit()
