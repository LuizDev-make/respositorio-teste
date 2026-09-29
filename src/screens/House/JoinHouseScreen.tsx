import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ScreenContainer, Button, Input } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { useHouse } from '../../contexts/HouseContext';
import { useAuth } from '../../contexts/AuthContext';
import { INVITE_CODE_LENGTH } from '../../config/constants';

export function JoinHouseScreen() {
  const { user } = useAuth();
  const { joinHouse } = useHouse();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!user) return;
    
    if (code.trim().length !== INVITE_CODE_LENGTH) {
      setError(`O código deve ter ${INVITE_CODE_LENGTH} caracteres.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await joinHouse(user.uid, code.trim().toUpperCase());
      // On success, HouseContext updates and MainNav takes over
    } catch (err: any) {
      setError(err.message || 'Nenhuma casa encontrada com este código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Entre na sua casa</Text>
        <Text style={styles.subtitle}>Digite o código de convite que você recebeu.</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Código de convite"
          placeholder="Ex: AURORA"
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase());
            setError('');
          }}
          error={error}
          icon="key"
          autoCapitalize="characters"
          maxLength={INVITE_CODE_LENGTH}
          editable={!loading}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Entrar"
          onPress={handleJoin}
          loading={loading}
          disabled={loading || code.trim().length === 0}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  form: {
    flex: 1,
  },
  footer: {
    paddingVertical: SPACING.md,
  },
});
