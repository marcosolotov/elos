# Elos - Sistema de Gestão de Estoque, Validade e Rastreabilidade

Sistema desktop para gestão de estoque, controle de validade e rastreabilidade de lotes, desenvolvido com Electron + TypeScript + React + SQLite.

## Características

- ✅ 100% offline - funciona sem internet
- ✅ Cross-platform - Windows, macOS e Linux
- ✅ Banco de dados local SQLite
- ✅ Interface moderna com Ant Design
- ✅ Arquitetura preparada para migração para nuvem
- ✅ Integração com scanner QR Code e balanças

## Módulos

1. **Dashboard** - Visão geral do estoque e alertas
2. **Itens** - Cadastro e gerenciamento de itens
3. **Lotes** - Controle de lotes e validades
4. **Validade** - Alertas de vencimento
5. **Rastreabilidade** - Histórico de lotes
6. **Inventário** - Contagem e ajustes
7. **Rendimento** - Controle de produção
8. **Perdas** - Registro de desperdícios
9. **Compras** - Lista de compras inteligente
10. **Relatórios** - Indicadores gerenciais
11. **Configurações** - Preferências do sistema

## Tecnologias

- **Electron** - Runtime desktop
- **TypeScript** - Linguagem de programação
- **React** - Interface do usuário
- **Ant Design** - Biblioteca de componentes UI
- **SQLite** - Banco de dados local
- **better-sqlite3** - Driver SQLite
- **Vite** - Build tool
- **Zustand** - Gerenciamento de estado

## Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd elos

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Gerar instalador
npm run dist
```

## Scripts Disponíveis

- `npm run dev` - Inicia o aplicativo em modo desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run dist` - Gera instaladores para Windows, Mac e Linux
- `npm run dist:win` - Gera instalador para Windows
- `npm run dist:mac` - Gera instalador para macOS
- `npm run dist:linux` - Gera instalador para Linux

## Estrutura do Projeto

```
elos/
├── src/
│   ├── main/                    # Processo principal (Electron)
│   │   ├── main.ts             # Ponto de entrada
│   │   ├── preload.ts          # Script de preload
│   │   ├── database/           # Camada de dados
│   │   │   ├── DatabaseService.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   ├── services/           # Lógica de negócio
│   │   │   ├── EstoqueService.ts
│   │   │   ├── LoteService.ts
│   │   │   └── RelatorioService.ts
│   │   └── peripherals/        # Integração com hardware
│   ├── renderer/               # Processo de renderização (UI)
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── index.css
│   │       ├── pages/          # Páginas da aplicação
│   │       └── store/          # Estado global
│   └── shared/                 # Código compartilhado
│       └── types.ts            # TypeScript interfaces
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Arquitetura

O projeto segue uma arquitetura em camadas:

```
┌───────────────────────────────────────────────┐
│              UI Layer (React)                  │
│  Páginas  │  Componentes  │  Estado (Zustand)  │
├───────────────────────────────────────────────┤
│         Business Layer (Services)              │
│  EstoqueService │ LoteService │ RelatorioSvc   │
├───────────────────────────────────────────────┤
│         Data Layer (Repositories)              │
│  IEstoqueRepo │ ILoteRepo │ IRelatorioRepo      │
├───────────────────────────────────────────────┤
│    SQLiteRepo (offline)  │  [Futuro] PgRepo   │
├───────────────────────────────────────────────┤
│       Infrastructure Layer                     │
│  SerialPort │ QRCodeGen │ PDFExport │ Backup    │
└───────────────────────────────────────────────┘
```

## Migração para Nuvem

A arquitetura foi projetada com "cloud readiness" desde o início. A camada de Repositories utiliza o padrão Ports & Adapters, permitindo migrar de SQLite para PostgreSQL sem alterar a lógica de negócio.

### Fases da Migração:

1. **Fase 1** - Desktop Offline (MVP) - SQLite local
2. **Fase 2** - Sincronização Híbrida - SQLite + API REST
3. **Fase 3** - Web App Multi-usuário - Backend Node.js + PostgreSQL
4. **Fase 4** - Multi-unidade/Multi-loja - Multi-tenancy

## Banco de Dados

O schema do banco de dados inclui:
- `usuario` - Usuários do sistema
- `item` - Itens de estoque
- `lote` - Lotes de itens
- `movimentacao` - Histórico de movimentações
- `fornecedor` - Fornecedores
- `grupo_categoria` - Organização hierárquica
- `perda_desperdicio` - Registro de perdas
- `rendimento` - Controle de rendimento
- `inventario` - Inventários
- `lista_compra` - Listas de compras
- `etiqueta_qrcode` - Etiquetas QR Code

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

ISC

## Autor

Desenvolvido por: [Seu nome aqui]

## Data

Versão 1.0 - 11/07/2026