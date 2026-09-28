# Contratos Compartilhados — Moradia

Este documento define os contratos de dados e serviços que todos os integrantes devem seguir. Qualquer alteração deve ser comunicada à equipe e atualizada aqui antes de implementar.

## Tecnologias Definidas

| Decisão | Escolha |
|---|---|
| Framework mobile | React Native (Expo SDK 52) |
| Linguagem | TypeScript (strict mode) |
| Autenticação | Firebase Authentication (Email/Senha) |
| Banco de dados | Cloud Firestore |
| Notificações push | Firebase Cloud Messaging (FCM) |
| Navegação | React Navigation v7 |
| Testes | Jest + Testing Library |
| Linting | ESLint + Prettier |

## Coleções Firestore

### `users`
Documento ID: UID do Firebase Auth

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| uid | string | Sim | ID da autenticação |
| displayName | string | Sim | Nome de exibição |
| email | string | Sim | E-mail |
| phone | string \| null | Não | Telefone para contato |
| createdAt | Timestamp | Sim | Data de criação |

### `houses`
Documento ID: gerado automaticamente

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | ID do documento |
| name | string | Sim | Nome da casa (max 50 chars) |
| inviteCode | string | Sim | Código de convite (6 chars, único) |
| createdBy | string | Sim | UID do criador |
| createdAt | Timestamp | Sim | Data de criação |

### `house_invites`
Documento ID: código de convite normalizado

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| houseId | string | Sim | ID da casa |
| createdAt | Timestamp | Sim | Data de criação |

### `memberships`
Documento ID: `{userId}_{houseId}`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| houseId | string | Sim | ID da casa |
| userId | string | Sim | UID do usuário |
| joinedAt | Timestamp | Sim | Data de entrada |

### `expenses`
Documento ID: gerado automaticamente

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | ID do documento |
| houseId | string | Sim | ID da casa |
| authorId | string | Sim | UID do autor |
| title | string | Sim | Título livre (max 100 chars) |
| totalCents | number | Sim | Total em centavos (> 0) |
| date | Timestamp | Sim | Data da despesa |
| competence | string | Sim | Mês de competência (YYYY-MM) |
| recipientId | string \| null | Não | Morador que recebe (null = pagamento direto) |
| version | number | Sim | Controle de versão (inicia em 1) |
| deleted | boolean | Sim | Exclusão lógica |
| createdAt | Timestamp | Sim | Data de criação |
| updatedAt | Timestamp | Sim | Última atualização |

### `expense_splits`
Documento ID: `{expenseId}_{memberId}`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| expenseId | string | Sim | ID da despesa |
| memberId | string | Sim | UID do participante |
| amountCents | number | Sim | Valor inicialmente pendente em centavos |

### `payments`
Documento ID: gerado automaticamente

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | ID do documento |
| expenseId | string | Sim | ID da despesa |
| payerId | string | Sim | UID de quem pagou |
| recipientId | string \| null | Não | Quem recebeu (null = externo) |
| amountCents | number | Sim | Valor pago em centavos |
| paidAt | Timestamp | Sim | Data do pagamento |
| registeredBy | string | Sim | UID de quem registrou |
| createdAt | Timestamp | Sim | Data do registro |

### `tasks`
Documento ID: gerado automaticamente

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | ID do documento |
| houseId | string | Sim | ID da casa |
| title | string | Sim | Título (max 100 chars) |
| description | string \| null | Não | Descrição (max 500 chars) |
| frequency | string | Sim | 'daily' ou 'weekly' |
| rotationOrder | string[] | Sim | UIDs na ordem do rodízio |
| currentRotationIndex | number | Sim | Índice atual do rodízio |
| active | boolean | Sim | Tarefa ativa |
| createdBy | string | Sim | UID do criador |
| createdAt | Timestamp | Sim | Data de criação |
| updatedAt | Timestamp | Sim | Última atualização |

### `task_occurrences`
Documento ID: gerado automaticamente

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | ID do documento |
| taskId | string | Sim | ID da tarefa |
| houseId | string | Sim | ID da casa |
| assigneeId | string | Sim | UID do responsável |
| dueDate | Timestamp | Sim | Data limite |
| status | string | Sim | 'pending', 'completed' ou 'overdue' |
| completedAt | Timestamp \| null | Não | Data de conclusão |
| completedBy | string \| null | Não | UID de quem concluiu |
| createdAt | Timestamp | Sim | Data de criação |

### `shopping_items`
Documento ID: gerado automaticamente

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | ID do documento |
| houseId | string | Sim | ID da casa |
| name | string | Sim | Nome do item |
| quantity | number | Sim | Quantidade |
| notes | string \| null | Não | Observações |
| status | string | Sim | 'pending', 'in_cart' ou 'bought' |
| addedBy | string | Sim | UID do autor |
| addedAt | Timestamp | Sim | Data de adição |
| lastChangedBy | string | Sim | UID da última alteração |
| lastChangedAt | Timestamp | Sim | Data da última alteração |
| boughtAt | Timestamp \| null | Não | Data da compra |

### `device_tokens`
Documento ID: `{userId}_{platform}`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| userId | string | Sim | UID do usuário |
| token | string | Sim | Token FCM |
| platform | string | Sim | 'ios', 'android' ou 'web' |
| updatedAt | Timestamp | Sim | Última atualização |

## Contratos de Serviço

### Serviço da Casa (Pessoa 1 → Pessoa 2 e Pessoa 3)

```typescript
// Importar de '@/services/houseService'

createHouse(userId: string, houseName: string): Promise<House>
joinHouseByCode(userId: string, code: string): Promise<House>
getUserHouse(userId: string): Promise<House | null>
getHouseMembers(houseId: string, requestingUserId: string): Promise<HouseMember[]>
getHouseById(houseId: string, requestingUserId: string): Promise<House | null>
getUserMembership(userId: string): Promise<HouseMembership | null>
verifyMembership(userId: string, houseId: string): Promise<boolean>
```

### Serviço de Tarefas (Pessoa 1 → Pessoa 2 e Pessoa 4)

```typescript
// Importar de '@/services/taskService'

createTask(params: CreateTaskParams): Promise<Task>
getTask(taskId: string, requestingUserId: string): Promise<Task | null>
getHouseTasks(houseId: string, requestingUserId: string): Promise<Task[]>
updateTask(params: UpdateTaskParams): Promise<Task>
deactivateTask(taskId: string, userId: string): Promise<void>
getTaskOccurrences(taskId: string, requestingUserId: string, options?: { month?: string }): Promise<TaskOccurrence[]>
getCurrentOccurrences(houseId: string, requestingUserId: string): Promise<TaskOccurrence[]>
getMyOccurrences(houseId: string, userId: string): Promise<TaskOccurrence[]>
completeOccurrence(occurrenceId: string, userId: string): Promise<TaskOccurrence>
checkOverdueOccurrences(houseId: string): Promise<number>
```

### Contextos React (Pessoa 1 → Pessoa 2)

```typescript
// Importar de '@/contexts/HouseContext'
useHouse(): {
  house, members, loading, error,
  createHouse, joinHouse, loadUserHouse, loadMembers, refreshHouse
}

// Importar de '@/contexts/TaskContext'
useTask(): {
  tasks, currentOccurrences, myOccurrences, loading, error,
  loadHouseTasks, loadCurrentOccurrences, loadMyOccurrences,
  createTask, updateTask, deactivateTask, completeOccurrence,
  getTaskOccurrences, refreshAll
}
```

### Serviço de Autenticação (Pessoa 3 → Todos)

```typescript
// Contrato esperado - Pessoa 3 implementará
// Importar de '@/services/authService'

signUp(email: string, password: string, displayName: string): Promise<User>
signIn(email: string, password: string): Promise<User>
signOut(): Promise<void>
resetPassword(email: string): Promise<void>
getCurrentUser(): User | null
onAuthStateChanged(callback: (user: User | null) => void): () => void
updateProfile(userId: string, data: Partial<UserProfile>): Promise<void>
```

### Serviço Financeiro (Pessoa 3 → Pessoa 2 e Pessoa 4)

```typescript
// Contrato esperado - Pessoa 3 implementará
// Importar de '@/services/expenseService'

createExpense(params: CreateExpenseParams): Promise<Expense>
getExpensesByCompetence(houseId: string, competence: string, userId: string): Promise<Expense[]>
getExpenseById(expenseId: string, userId: string): Promise<Expense | null>
updateExpense(params: UpdateExpenseParams): Promise<Expense>
deleteExpense(expenseId: string, userId: string): Promise<void>
registerPayment(params: RegisterPaymentParams): Promise<Payment>
getExpensePayments(expenseId: string, userId: string): Promise<Payment[]>
getMemberBalance(houseId: string, memberId: string, competence: string): Promise<MemberBalance>
getMonthSummary(houseId: string, competence: string, userId: string): Promise<MonthSummary>
```

### Serviço de Compras (Pessoa 3 → Pessoa 2)

```typescript
// Contrato esperado - Pessoa 3 implementará
// Importar de '@/services/shoppingService'

addItem(houseId: string, userId: string, name: string, quantity: number, notes?: string): Promise<ShoppingItem>
getItems(houseId: string, userId: string): Promise<ShoppingItem[]>
updateItemStatus(itemId: string, userId: string, status: ShoppingItemStatus): Promise<ShoppingItem>
subscribeToItems(houseId: string, userId: string, callback: (items: ShoppingItem[]) => void): () => void
getHistory(houseId: string, userId: string, month: string): Promise<ShoppingItem[]>
```

## Regras de Negócio Acordadas

1. **Uma casa por usuário** neste MVP. Troca e saída de casa ficam fora.
2. **Todos os moradores consultam** os dados da casa. O autor de uma despesa pode editar ou excluir.
3. **Confirmação financeira**: quem paga ou recebe pode registrar. Guardar quem registrou e impedir duplicidade.
4. **Pagamento direto**: quando nenhum morador recebe, cada participante registra o próprio pagamento externo.
5. **Histórico**: consultar meses anteriores não modifica competência nem oculta dívidas pendentes.
6. **Exclusão lógica**: retirar dos totais e listas, preservar registros para consistência.
7. **Valores monetários**: centavos inteiros. Formatar como BRL apenas na interface.
8. **Rodízio de tarefas**: sequência cíclica. Alterações só afetam ocorrências futuras.
9. **Edição de despesa após pagamento**: proibido alterar divisão e destinatário. Permitido corrigir título e data.

## Decisões Pendentes

- [ ] Fuso horário da casa (sugestão: America/Sao_Paulo)
- [ ] Limite de moradores por casa
- [ ] Preferência de notificação padrão (ativa ou inativa)
