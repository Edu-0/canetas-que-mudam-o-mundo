from fastapi import APIRouter, HTTPException, Depends
from app.schemas import doacao as s
from app.core.deps_auth import VerificarPermissao, get_current_user
from app.database.connection import SessionDep
from app.models.user import Usuario
from app.models.doacao import ItemDoacao, AvaliacaoTriagemDoacao
from app.models.ong import VoluntarioOng

router = APIRouter(prefix="/triagem", tags=["triagem"])

@router.post("/analise-materiais/{material_id}", response_model = s.RespostaAvaliacaoTriagemDoacao)
def analisar_materias_voluntario(material_id:int, dados:s.CriarAvaliacaoTriagemDoacao, db:SessionDep, usuario_atual: Usuario = Depends(get_current_user)):

    material = db.query(ItemDoacao).filter(material_id == ItemDoacao.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Item de doação não encontrado.")

    if usuario_atual.ong.id != material.doacao.ong_id:
        raise HTTPException(status_code=403, detail="Você não possui permissão para avaliar esse item - Ele não pertence a sua ONG.")
    
    vinculo = db.query(VoluntarioOng).filter(
        VoluntarioOng.usuario_id == usuario_atual.id,
        VoluntarioOng.ong_id == material.doacao.ong_id 
    ).first()

    if not vinculo:
        raise HTTPException(status_code=403, detail="Vínculo de voluntário não encontrado.")

    avaliacao = AvaliacaoTriagemDoacao(
        item_doacao_id = material_id,
        voluntario_triagem_id = usuario_atual.id,
        resultado = dados.resultado,
        checklist = dados.checklist,
        comentario = dados.comentario,
        motivo_inaptidao = dados.motivo_inaptidao
    )

    if vinculo.nivel_confianca < 10:
        avaliacao.em_quarentena = True
    
    try: 
        db.add(avaliacao)
        db.commit()
        db.refresh(avaliacao)
        return avaliacao
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail=f"Erro ao cadastrar avaliação: {str(e)}"
        )
    


# Avaliar Doacao Coordenador (PUT)
@router.put("/analise-triagem/{triagem_id}")
def verificar_analise_do_voluntario(triagem_id:int, dados:s.,db:SessionDep, usuario_atual:Usuario = Depends(get_current_user)):

    avaliacao = db.query(AvaliacaoTriagemDoacao).filter(triagem_id == AvaliacaoTriagemDoacao.id).first()
    if not avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")
    
    ong = avaliacao.item_doacao.doacao.ong

    if usuario_atual.id != ong.usuario_id:
        raise HTTPException(status_code=403, detail="Você não é o coordenador da ONG informada.")
    

# cada modificação na avaliação da triagem (mudança de resultado) o nivel de confianca perde ponto

#get para avaliacoes que precisam que o coordenador analisem -> em_quarentena = True