# Arquitetura do App Mobile - Elos Scanner

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                      REDE LOCAL (LAN)                           │
│                   192.168.x.x / 10.x.x.x                        │
│                    Sem acesso à Internet                        │
└─────────────────────────────────────────────────────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│     PC com Elos (Servidor)  │    │    App Android (Cliente)    │
│                             │    │                             │
│  ┌───────────────────────┐  │    │  ┌───────────────────────┐  │
│  │   Electron App (Elos) │  │    │  │   Câmera (QR Code)    │  │
│  │                       │  │    │  │   - Leitor de QR      │  │
│  │   ┌───────────────┐   │  │    │  │   - ML Kit / ZXing    │  │
│  │   │ SQLite DB     │   │  │    │  └───────────────────────┘  │
│  │   └───────────────┘   │  │    │                             │
│  │                       │  │    │  ┌───────────────────────┐  │
│  │   ┌───────────────┐   │  │    │  │   Interface Mobile    │  │
│  │   │ API REST      │   │  │    │  │   - Detalhes do Item  │  │
│  │   │ (Express.js)  │◄──┼──┼──┼──►│   - Registrar Saída   │  │
│  │   └───────────────┘   │  │    │  │   - Contar Inventário │  │
│  │                       │  │    │  └───────────────────────┘  │
│  │   ┌───────────────┐   │  │    │                             │
│  │   │ Serviços      │   │  │    │  ┌───────────────────────┐  │
│  │   │ - Estoque     │   │  │    │  │   HTTP Client         │  │
│  │   │ - Lote        │   │  │    │  │   (Retrofit/OkHttp)   │  │
│  │   │ - Relatório   │   │  │    │  └───────────────────────┘  │
│  │   └───────────────┘   │  │    │                             │
│  └───────────────────────┘  │    └─────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

```
┌──────────┐    QR Code     ┌──────────┐    HTTP/JSON    ┌──────────┐
│  Câmera  │ ──────────────►│ Android  │ ───────────────►│  Elos PC │
│ Android  │                │   App    │                 │ Servidor │
└──────────┘                └──────────┘                 └──────────┘
                                  │                           │
                                  │                           │
                                  ▼                           ▼
                          ┌──────────────┐           ┌──────────────┐
                          │  Tela App    │           │   SQLite DB  │
                          │  - Detalhes  │           │   - Lotes    │
                          │  - Saída     │           │   - Itens    │
                          │  - Contagem  │           │   - Mov.     │
                          └──────────────┘           └──────────────┘
```

## Componentes do Sistema

### 1. Servidor HTTP no Elos PC (Express.js)

```javascript
// Endpoints da API REST
GET  /api/lote/:codigo          → Consultar lote por QR Code
POST /api/saida                 → Registrar saída de produto
POST /api/inventario/contagem   → Registrar contagem de inventário
GET  /api/inventario/aberto     → Verificar inventário aberto
GET  /api/status                → Health check do servidor
```

**Tecnologia:** Express.js rodando como processo filho do Electron

**Porta:** 3000 (configurável)

**Segurança:** 
- Acesso apenas na rede local (bind em 0.0.0.0)
- Token de autenticação simples (opcional)
- Rate limiting básico

### 2. App Android (Kotlin + Jetpack Compose)

**Telas:**

```
┌─────────────────────────────┐
│     Tela Inicial (Scanner)  │
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   CÂMERA (Preview)  │   │
│   │                     │   │
│   │   ┌─────────────┐   │   │
│   │   │  QR CODE    │   │   │
│   │   │  [  ] [  ]  │   │   │
│   │   │  [  ] [  ]  │   │   │
│   │   └─────────────┘   │   │
│   └─────────────────────┘   │
│                             │
│   [ Configurar Servidor ]   │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Detalhes do Lote/Item     │
│                             │
│   ┌─────────────────────┐   │
│   │   Item: Tomate      │   │
│   │   Lote: LOTE-001    │   │
│   │   Validade: 15/08   │   │
│   │   Saldo: 25.00 kg   │   │
│   └─────────────────────┘   │
│                             │
│   [ Registrar Saída ]       │
│   [ Contar Inventário ]     │
│   [ ← Voltar ]              │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Registrar Saída           │
│                             │
│   Item: Tomate              │
│   Lote: LOTE-001            │
│   Saldo: 25.00 kg           │
│                             │
│   Quantidade: [___] kg      │
│   Motivo: [______________]  │
│                             │
│   [ Confirmar Saída ]       │
│   [ Cancelar ]              │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Contagem de Inventário    │
│                             │
│   Inventário: #001          │
│   Status: Aberto            │
│                             │
│   Item: Tomate              │
│   Esperado: 25.00 kg        │
│   Contado:  [___] kg        │
│                             │
│   [ Salvar Contagem ]       │
│   [ Próximo Item ]          │
└─────────────────────────────┘
```

**Tecnologias:**
- Kotlin + Jetpack Compose (UI moderna)
- CameraX + ML Kit (leitura QR Code)
- Retrofit + OkHttp (comunicação HTTP)
- ViewModel + StateFlow (estado)
- Room (cache local opcional)

### 3. Comunicação (Rede Local)

```
┌─────────────────────────────────────────────────────────────┐
│                    Protocolo HTTP/1.1                        │
│                    Content-Type: application/json            │
│                                                             │
│  Request:  POST /api/saida                                  │
│  Body:     { "lote_id": "abc", "quantidade": 5.0,          │
│              "motivo": "Uso na cozinha",                    │
│              "usuario_id": "mobile_user" }                  │
│                                                             │
│  Response: { "success": true, "id": "mov_123",             │
│              "novo_saldo": 20.0 }                           │
└─────────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

### No Elos PC (backend)

```
src/
├── main/
│   ├── server/                    # NOVO - Servidor HTTP
│   │   ├── ApiServer.ts           # Inicialização do Express
│   │   ├── routes/
│   │   │   ├── loteRoutes.ts      # GET /api/lote/:codigo
│   │   │   ├── saidaRoutes.ts     # POST /api/saida
│   │   │   └── inventarioRoutes.ts # POST /api/inventario/contagem
│   │   ├── middleware/
│   │   │   └── auth.ts            # Autenticação simples
│   │   └── types.ts               # Tipos da API
│   └── main.ts                    # Inicializar ApiServer junto com Electron
```

### App Android

```
elos-scanner-android/
├── app/
│   ├── src/main/
│   │   ├── java/com/elos/scanner/
│   │   │   ├── MainActivity.kt
│   │   │   ├── scanner/
│   │   │   │   ├── ScannerScreen.kt        # Tela da câmera
│   │   │   │   └── QrCodeAnalyzer.kt       # Analisador QR Code
│   │   │   ├── detail/
│   │   │   │   ├── DetailScreen.kt         # Detalhes do lote
│   │   │   │   └── DetailViewModel.kt
│   │   │   ├── saida/
│   │   │   │   ├── SaidaScreen.kt          # Registrar saída
│   │   │   │   └── SaidaViewModel.kt
│   │   │   ├── inventario/
│   │   │   │   ├── ContagemScreen.kt       # Contar inventário
│   │   │   │   └── ContagemViewModel.kt
│   │   │   ├── network/
│   │   │   │   ├── ApiService.kt           # Retrofit interface
│   │   │   │   ├── ApiClient.kt            # OkHttp client
│   │   │   │   └── models/                 # DTOs
│   │   │   └── config/
│   │   │       └── ServerConfig.kt         # Config IP/porta
│   │   ├── res/
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## Fluxo de Uso

### 1. Leitura de QR Code e Saída

```
Usuário abre app → Câmera escaneia QR Code da etiqueta
       │
       ▼
App envia GET /api/lote/LOTE-001 para o PC
       │
       ▼
PC consulta SQLite, retorna dados do lote
       │
       ▼
App exibe: Item, Lote, Validade, Saldo
       │
       ▼
Usuário toca em "Registrar Saída"
       │
       ▼
App exibe formulário: Quantidade + Motivo
       │
       ▼
Usuário confirma → App envia POST /api/saida
       │
       ▼
PC registra movimentação no SQLite, retorna sucesso
       │
       ▼
App exibe confirmação "Saída registrada com sucesso"
```

### 2. Contagem de Inventário

```
Usuário abre app → Toca em "Contar Inventário"
       │
       ▼
App verifica GET /api/inventario/aberto
       │
       ▼
Se há inventário aberto, inicia contagem
       │
       ▼
Câmera escaneia QR Code do lote
       │
       ▼
App exibe: Item + Saldo Esperado
       │
       ▼
Usuário digita quantidade contada
       │
       ▼
App envia POST /api/inventario/contagem
       │
       ▼
PC salva contagem no SQLite
       │
       ▼
App exibe "Contagem salva" e volta para scanner
```

## Configuração de Rede

### Descoberta do Servidor

Opção 1: **Configuração manual**
- Usuário digita o IP do PC na tela de configuração do app
- IP fixo recomendado no PC para facilitar

Opção 2: **Descoberta automática (mDNS/Bonjour)**
- PC anuncia serviço `_elos._tcp` na rede
- App descobre automaticamente

### Firewall

- Porta 3000 (ou configurada) deve estar liberada no firewall do PC
- Windows: liberar automaticamente via Electron
- macOS/Linux: solicitar permissão

## Tecnologias Sugeridas

| Componente | Tecnologia | Versão |
|------------|-----------|--------|
| Servidor HTTP | Express.js | 4.x |
| App Android | Kotlin + Jetpack Compose | Última estável |
| QR Code | ML Kit Barcode Scanning | Google Play Services |
| HTTP Client | Retrofit + OkHttp | 2.x / 4.x |
| Build Android | Gradle + AGP | 8.x |

## Próximos Passos

1. ✅ **Fase 1** - Implementar servidor HTTP no Elos PC
2. ⬜ **Fase 2** - Criar projeto Android com tela de scanner
3. ⬜ **Fase 3** - Implementar tela de detalhes e saída
4. ⬜ **Fase 4** - Implementar contagem de inventário
5. ⬜ **Fase 5** - Testes integrados em rede local
6. ⬜ **Fase 6** - Empacotar APK e documentação