import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';

// ============================================
// Auth Stack — telas de autenticação
// ============================================
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// ============================================
// House Setup Stack — configuração inicial da casa
// ============================================
export type HouseStackParamList = {
  HouseChoice: undefined;
  CreateHouse: undefined;
  JoinHouse: undefined;
  InviteCode: { inviteCode: string; houseName: string };
};

// ============================================
// Expense Stack — fluxo financeiro
// ============================================
export type ExpenseStackParamList = {
  ExpenseList: undefined;
  ExpenseDetail: { expenseId: string };
  CreateExpense: undefined;
  EditExpense: { expenseId: string };
  PendingPayments: { expenseId: string };
  RegisterPayment: {
    expenseId: string;
    payerId: string;
    payerName: string;
    maxAmountCents: number;
  };
};

// ============================================
// Task Stack (placeholder — não funcional na E1)
// ============================================
export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined;
  EditTask: { taskId: string };
};

// ============================================
// Main Tabs — navegação principal
// ============================================
export type MainTabsParamList = {
  Home: undefined;
  Expenses: undefined;
  Tasks: undefined;
  Shopping: undefined;
  HouseInfo: undefined;
};

// ============================================
// Navigation prop helpers
// ============================================
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type HouseNavigationProp = NativeStackNavigationProp<HouseStackParamList>;
export type ExpenseNavigationProp = NativeStackNavigationProp<ExpenseStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabsParamList>;

// Route prop helpers
export type AuthRouteProp<T extends keyof AuthStackParamList> = RouteProp<AuthStackParamList, T>;
export type HouseRouteProp<T extends keyof HouseStackParamList> = RouteProp<HouseStackParamList, T>;
export type ExpenseRouteProp<T extends keyof ExpenseStackParamList> = RouteProp<ExpenseStackParamList, T>;

// Composite navigation for screens in tabs that also use stacks
export type AppStackParamList = AuthStackParamList &
  HouseStackParamList &
  MainTabsParamList &
  ExpenseStackParamList &
  TaskStackParamList;

export type NavigationProps<T extends keyof AppStackParamList> =
  NativeStackNavigationProp<AppStackParamList, T>;
export type AppRouteProps<T extends keyof AppStackParamList> =
  RouteProp<AppStackParamList, T>;
