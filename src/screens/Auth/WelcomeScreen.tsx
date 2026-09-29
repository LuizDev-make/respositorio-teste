import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { Button, ScreenContainer } from '../../components';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Feather name="home" size={24} color={COLORS.primary} />
            <Text style={styles.brandText}>moradia</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.illustrationContainer}>
            <Feather name="home" size={64} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Sua casa, no mesmo ritmo.</Text>
          <Text style={styles.subtitle}>
            Organize despesas, tarefas e a convivência da sua casa em um só lugar.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Criar minha conta" 
            onPress={() => navigation.navigate('Register')} 
            style={styles.primaryButton}
          />
          <Button 
            title="Já tenho uma conta" 
            variant="ghost" 
            onPress={() => navigation.navigate('Login')} 
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  brandText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  footer: {
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  primaryButton: {
    marginBottom: SPACING.xs,
  }
});
