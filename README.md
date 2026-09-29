# 🏠 Moradia - Aplicativo de Moradia Compartilhada

Aplicativo mobile para organizar moradias compartilhadas. Gerencie despesas, tarefas domésticas e compras de forma colaborativa.

## 📚 Visão Geral

O Moradia permite que moradores de uma casa compartilhada:
- Criem e entrem em uma casa usando código de convite
- Registrem e dividam despesas
- Organizem tarefas domésticas com rodízio automático
- Compartilhem listas de compras em tempo real
- Recebam notificações de tarefas pendentes

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native (Expo) | Aplicação mobile multiplataforma |
| TypeScript | Tipagem estática |
| Firebase Auth | Autenticação de usuários |
| Cloud Firestore | Banco de dados em tempo real |
| Firebase Cloud Messaging | Notificações push |
| Jest | Testes automatizados |
| ESLint + Prettier | Qualidade e formatação do código |

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.x
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Conta no Firebase (https://console.firebase.google.com)
- Emulador Android/iOS ou dispositivo físico com Expo Go

### 1. Clonar o repositório

```bash
git clone https://github.com/CarlosBinho/Mundo_2_Moradia_Casa_App.git
cd moradia-app
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Authentication** com provedor Email/Senha
3. Crie um banco **Cloud Firestore** em modo de produção
4. Copie as credenciais do projeto

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as credenciais do Firebase:

```
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

### 5. Configurar regras do Firestore

Instale o Firebase CLI e aplique as regras:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. Executar o aplicativo

```bash
npm start
```

Escaneie o QR code com o Expo Go ou pressione `a` para Android / `i` para iOS.

## 📁 Estrutura do Projeto

```
moradia-app/
├── App.tsx                    # Ponto de entrada
├── app.json                   # Configuração Expo
├── firebase.json              # Configuração Firebase
├── firestore.rules            # Regras de segurança Firestore
├── firestore.indexes.json     # Índices Firestore
├── .env.example               # Exemplo de variáveis de ambiente
└── src/
    ├── config/                # Configurações (Firebase, constantes)
    ├── contexts/              # Contextos React (Auth, House, Task)
    ├── navigation/            # Navegadores e rotas
    ├── screens/               # Telas do aplicativo
    ├── services/              # Serviços de acesso ao Firestore
    ├── types/                 # Definições de tipos TypeScript
    ├── utils/                 # Utilitários (formatação, validação, etc.)
    └── __tests__/             # Testes automatizados
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

## 📝 Validação de Código

```bash
# Lint
npm run lint

# Formatação
npm run format

# Verificar formatação
npm run format:check

# Verificar tipos
npm run typecheck
```

## 📊 Modelo de Dados

### Entidades principais

| Entidade | Coleção Firestore | Descrição |
|---|---|---|
| Usuário | `users` | Perfil do usuário autenticado |
| Casa | `houses` | Casa compartilhada |
| Vínculo | `memberships` | Relação usuário-casa |
| Convite | `house_invites` | Mapeamento código → casa |
| Despesa | `expenses` | Despesa da casa |
| Divisão | `expense_splits` | Divisão por participante |
| Pagamento | `payments` | Registro de pagamento |
| Tarefa | `tasks` | Tarefa doméstica |
| Ocorrência | `task_occurrences` | Instância de uma tarefa |
| Item de Compra | `shopping_items` | Item da lista de compras |
| Dispositivo | `device_tokens` | Token de notificação |

### Regras de negócio documentadas

- **Casa ativa**: cada usuário participa de uma casa por vez neste MVP
- **Permissões**: todos os moradores consultam dados da casa; o autor de uma despesa pode editar/excluir seu registro
- **Confirmação financeira**: quem paga ou quem recebe pode registrar o pagamento; guardar quem registrou e impedir duplicidade
- **Pagamento direto**: quando nenhum morador recebe, cada participante registra o próprio pagamento externo
- **Histórico**: consultar meses anteriores não modifica a competência dos registros
- **Exclusão financeira**: exclusão lógica - retira dos totais, preserva registros para consistência
- **Valores monetários**: armazenados como centavos inteiros, formatados como BRL na interface
- **Rodízio de tarefas**: avança pela sequência definida, retorna ao primeiro após o último
- **Ocorrências**: alterações de periodicidade/rodízio afetam apenas ocorrências futuras

## 🔐 Segurança

- Autenticação via Firebase Auth (nunca armazenar senhas)
- Regras Firestore validam identidade e vínculo com a casa
- Variáveis de ambiente para credenciais (nunca commitar `.env`)
- Tokens e dados pessoais não expostos em logs

## 📦 Entregas

### Primeira entrega
- [x] Estrutura do projeto
- [x] Autenticação (Pessoa 3)
- [x] Grupo da Casa (Pessoa 1)
- [ ] Telas de entrada e navegação (Pessoa 2)
- [x] Módulo financeiro (Pessoa 3)
- [ ] Telas financeiras (Pessoa 2)
- [ ] Testes da primeira entrega (Pessoa 4)

### Segunda entrega
- [x] Tarefas e rodízio (Pessoa 1)
- [ ] Telas de tarefas (Pessoa 2)
- [ ] Compras em tempo real (Pessoa 3)
- [ ] Telas de compras (Pessoa 2)
- [ ] Notificações (Pessoa 3)
- [ ] Testes da segunda entrega (Pessoa 4)

## 🤝 Equipe

| Responsável | Área |
|---|---|
| Emanuel Henrique (Pessoa 1) | Estrutura, Grupo da Casa, Tarefas e Rodízio |
| Pessoa 2 | Interface mobile e integração visual |
| Maria Luiza (Pessoa 3) | Autenticação, financeiro, compras e notificações |
| Pessoa 4 | Testes, revisão e validação |

## 📌 Referências

- [Protótipo Figma](https://www.figma.com/design/5Ny1pUWbwpPkQQkO9S4OgT/Mundo-2)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
