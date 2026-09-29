import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { AuthStackParamList } from '../../types/navigation';
import { Button, Input, ScreenContainer } from '../../components';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/validators';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

interface Props {
  navigation: ForgotPasswordNavigationProp;
}

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const { resetPassword, loading, error: authError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError(undefined);
    setSuccess(false);

    if (!email) {
      setError('E-mail é obrigatório');
      return;
    } else if (!validateEmail(email)) {
      setError('E-mail inválido');
      return;
    }

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error', err);
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
            <Text style={styles.title}>Recuperar acesso</Text>
            <Text style={styles.subtitle}>
              Digite seu e-mail abaixo e enviaremos instruções para redefinir sua senha.
            </Text>
          </View>

          <View style={styles.form}>
            {success ? (
              <View style={styles.successContainer}>
                <Feather name="check-circle" size={48} color={COLORS.success} style={styles.successIcon} />
                <Text style={styles.successText}>E-mail enviado! Verifique sua caixa de entrada.</Text>
              </View>
            ) : (
              <>
                <Input
                  label="E-mail"
                  placeholder="Digite seu e-mail de cadastro"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(undefined);
                  }}
                  error={error}
                  leftIcon={<Feather name="mail" size={20} color={COLORS.textLight} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
                
                {authError ? (
                  <Text style={styles.mainError}>{authError.message || 'Erro ao enviar e-mail'}</Text>
                ) : null}

                <Button
                  title="Enviar instruções"
                  onPress={handleResetPassword}
                  loading={loading}
                  disabled={loading}
                  style={styles.submitButton}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Button
              title="Voltar para o login"
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
    lineHeight: 24,
  },
  form: {
    gap: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  mainError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  successText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
  },
});
