# canetas-que-mudam-o-mundo
Repositório para trabalho de Engenharia de Software II

backend/
  app/
    main.py        # ponto de entrada
    routes/        # endpoints (users, auth, etc)
    models/        # modelos do banco (ORM)
    schemas/       # validação (Pydantic)
    services/      # lógica de negócio
    database/      # conexão com banco
    core/          # configs (env, segurança)
  requirements.txt

  frontend/
  src/
    components/   # UI reutilizável (botões, inputs)
    pages/        # telas (Home, Login, etc)
    services/     # chamadas API (FastAPI)
    hooks/        # lógica reutilizável
    context/      # estado global
    utils/        # funções auxiliares
    assets/       # imagens, ícones
    App.jsx
    main.jsx
  public/
  package.json