import enum

class TipoUsuario(enum.Enum):
    GENERICO = "Comum"
    COORDENADOR_PROCESSOS = "Coordenador de Processos"
    RESPONSAVEL_BENEFICIARIO = "Responsável pelo beneficiário"
    DOADOR = "Doador"
    TRIAGEM = "Voluntário da triagem"

class BeneficiosUsuario(enum.Enum):
    BOLSA_FAMILIA = "Bolsa Família"
    BPC = "Benefício de Prestação Continuada"
    APOSENTADORIA = "Aposentadoria"
    NENHUM = "Nenhum"
