# Testes da M2

Execute a partir da pasta `backend`:

```bash
python -m unittest discover -v -s tests/M2 -p 'test_*.py'
```

Os testes usam um banco SQLite temporario em arquivo para validar regras de servico sem alterar o PostgreSQL real da apresentacao.

Para executar contra um PostgreSQL de teste, use uma URL separada contendo `test` no nome, pois a suite recria todas as tabelas:

```bash
M2_TEST_DATABASE_URL='postgresql+psycopg2://usuario:senha@localhost:5432/canetas_test' python -m unittest discover -v -s tests/M2 -p 'test_*.py'
```

Cobertura principal:

- Doacoes, fotos, triagem, quarentena, revisao de coordenador e status do material.
- Pedidos de material, limite de 20 itens, estoque, reservas, consumo, cancelamento e historico.
- Cadastro de voluntario por token de ONG.
- RBAC, login, logout e recuperacao de senha.
- OCR textual e validacoes de arquivos/formularios.

Pendencias futuras registradas sem quebrar a suite:

- Coordenador de Processos tambem atuar na tela de Status dos Materiais.
- Bloquear pedido de material quando a documentacao do responsavel ainda nao estiver aprovada.
- Revisar o cancelamento de reserva total para garantir que a quantidade do item de estoque nao seja duplicada.
