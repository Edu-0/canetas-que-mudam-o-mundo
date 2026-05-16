import enum

class TipoUsuario(enum.Enum):
    GENERICO = "Genérico"
    COORDENADOR_PROCESSOS = "Coordenador de Processos"
    RESPONSAVEL_BENEFICIARIO = "Responsável pelo beneficiário"
    DOADOR = "Doador"
    TRIAGEM = "Voluntário da triagem"

class BeneficiosUsuario(enum.Enum):
    BOLSA_FAMILIA = "Bolsa Família"
    BPC = "Benefício de Prestação Continuada"
    APOSENTADORIA = "Aposentadoria"
    NENHUM = "Nenhum"

class QualidadeImagem(enum.Enum):
    APTO = "Apto"
    INAPTO = "Inapto"

class StatusDoacao(enum.Enum):
    AGUARDANDO_TRIAGEM = "AGUARDANDO_TRIAGEM"
    PRE_APROVADO = "PRE_APROVADO"
    INAPTO = "INAPTO"
    DISPONIVEL = "DISPONIVEL"
    MATERIAL_COLETADO = "MATERIAL_COLETADO"
    CANCELADO = "CANCELADO"
    INCOMPLETO = "INCOMPLETO"
    AGUARDANDO_NOVA_TRIAGEM = "AGUARDANDO_NOVA_TRIAGEM"

class ResultadoTriagemDoacao(enum.Enum):
    PRE_APROVADO = "PRE_APROVADO"
    INAPTO = "INAPTO"
