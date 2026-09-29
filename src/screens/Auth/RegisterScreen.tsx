import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { Button, Input, ScreenContainer } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen = ({ navigation }: Props) => {
  const { signUp, loading, error: authError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleRegister = async () => {
    setErrors({});
    let isValid = true;
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    }
    
    if (!email) {
      newErrors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else {
      const pwdVal = validatePassword(password);
      if (!pwdVal.isValid) {
        newErrors.password = pwdVal.message;
        isValid = false;
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    try {
      await signUp(email, password, name);
    } catch (err) {
      console.error('Registration error', err);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Feather name="home" size={20} color={COLORS.primary} />
              <Text style={styles.brandText}>moradia</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Vamos começar?</Text>
            <Text style={styles.subtitle}>Crie sua conta para usar o Moradia.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nome"
              placeholder="Como quer ser chamado?"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
              leftIcon={<Feather name="user" size={20} color={COLORS.textLight} />}
              editable={!loading}
            />

            <Input
              label="E-mail"
              placeholder="Seu melhor e-mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              leftIcon={<Feather name="mail" size={20} color={COLORS.textLight} />}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Input
              label="Senha"
              placeholder="Mínimo de 6 caracteres"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              leftIcon={<Feather name="lock" size={20} color={COLORS.textLight} />}
              secureTextEntry
              editable={!loading}
            />

            <Input
              label="Confirmar Senha"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              error={errors.confirmPassword}
              leftIcon={<Feather name="lock" size={20} color={COLORS.textLight} />}
              secureTextEntry
              editable={!loading}
            />

            {authError ? (
              <Text style={styles.mainError}>{authError.message || 'Erro ao criar conta'}</Text>
            ) : null}

            <Button
              title="Criar conta"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footer}>
            <Button
              title="Já tenho uma conta"
              variant="ghost"
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  brandText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  titleContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  form: {
    gap: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
  mainError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
  },
});
