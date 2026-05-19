from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload

from app.core.deps_auth import VerificarPermissao, get_current_user
from app.core.enums import TipoUsuario
from app.database.connection import SessionDep
from app.models.estoque import ItemEstoque
from app.models.doacao import ItemDoacao, Doacao
from app.models.user import Usuario
from app.schemas.estoque import RespostaItemEstoque


router = APIRouter(prefix="/estoque", tags=["estoque"])


@router.get("/", response_model=list[RespostaItemEstoque])
def listar_estoque(
    db: SessionDep,
    data_inicio: date | None = Query(default=None),
    data_final: date | None = Query(default=None),
    ordem: str = Query(default="desc"),
    usuario_atual: Usuario = Depends(get_current_user),
    permissao=Depends(VerificarPermissao("doacao:listar")),
):
    if data_inicio and data_final and data_inicio > data_final:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=400, detail="Data inicial não pode ser maior que a data final."
        )

    query = db.query(ItemEstoque).join(ItemEstoque.item_doacao).join(ItemDoacao.doacao).options(
        selectinload(ItemEstoque.item_doacao).selectinload(ItemDoacao.fotos),
        selectinload(ItemEstoque.item_doacao).selectinload(ItemDoacao.doacao),
    )

    # Apenas itens que não foram retirados (estoque disponível)
    query = query.filter(ItemEstoque.retirado_em.is_(None))

    # Restrições por papel do usuário
    # Permitir: Voluntário da Triagem (vinculado à ONG) e Coordenador/usuário vinculado à ONG
    # Negar: Doadores não devem listar o estoque (estoque é visível internamente pela ONG)
    from app.core.enums import TipoUsuario as _TipoUsuario

    if any(func.tipo_usuario == TipoUsuario.TRIAGEM for func in usuario_atual.funcao):
        if not usuario_atual.vinculo_voluntario:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voluntário da triagem não possui vínculo com ONG.",
            )
        ong_id = usuario_atual.vinculo_voluntario.ong_id
        query = query.filter(Doacao.ong_id == ong_id)

    elif any(func.tipo_usuario == TipoUsuario.COORDENADOR_PROCESSOS for func in usuario_atual.funcao) or usuario_atual.ong:
        # Coordenador de processos ou qualquer usuário com ONG vinculada pode listar estoque da própria ONG
        if not usuario_atual.ong:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Coordenador não possui ONG vinculada.",
            )
        query = query.filter(Doacao.ong_id == usuario_atual.ong.id)

    elif any(func.tipo_usuario == TipoUsuario.DOADOR for func in usuario_atual.funcao):
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Voluntário da Triagem ou usuários da ONG podem listar estoque.",
        )

    else:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Voluntário da Triagem ou usuários da ONG podem listar estoque.",
        )

    if data_inicio:
        from datetime import datetime

        query = query.filter(ItemEstoque.disponivel_em >= datetime.combine(data_inicio, datetime.min.time()))

    if data_final:
        from datetime import datetime

        query = query.filter(ItemEstoque.disponivel_em <= datetime.combine(data_final, datetime.max.time()))

    ordem_normalizada = ordem.strip().lower()
    if ordem_normalizada in {"asc", "crescente", "antigas", "mais_antigas"}:
        ordenacao = ItemEstoque.disponivel_em.asc()
    else:
        ordenacao = ItemEstoque.disponivel_em.desc()

    return query.order_by(ordenacao).all()
