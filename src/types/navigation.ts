import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type HouseStackParamList = {
  HouseChoice: undefined;
  CreateHouse: undefined;
  JoinHouse: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Expenses: undefined;
  Tasks: undefined;
  Shopping: undefined;
  Profile: undefined;
};

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  ExpenseDetail: { expenseId: string };
  CreateExpense: undefined;
  EditExpense: { expenseId: string };
};

export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
  CreateTask: undefined;
  EditTask: { taskId: string };
};

export type AppStackParamList = AuthStackParamList & HouseStackParamList & MainTabsParamList & ExpenseStackParamList & TaskStackParamList;

export type NavigationProps<T extends keyof AppStackParamList> = NativeStackNavigationProp<AppStackParamList, T>;
export type AppRouteProps<T extends keyof AppStackParamList> = RouteProp<AppStackParamList, T>;
