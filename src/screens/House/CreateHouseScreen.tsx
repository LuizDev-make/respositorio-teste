import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Button, Input } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { useHouse } from '../../contexts/HouseContext';
import { useAuth } from '../../contexts/AuthContext';
import { validateHouseName } from '../../utils/validators';

type NavigationProp = NativeStackNavigationProp<any, 'CreateHouse'>;

export function CreateHouseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { createHouse } = useHouse();

  const [houseName, setHouseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!user) return;
    
    const validationError = validateHouseName(houseName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const inviteCode = await createHouse(user.uid, houseName.trim());
      if (inviteCode) {
        navigation.navigate('InviteCode', { inviteCode, houseName: houseName.trim() });
      } else {
        setError('Erro ao criar casa. Tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a casa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Dê nome à sua casa</Text>
        <Text style={styles.subtitle}>Escolha um nome para identificar sua casa.</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Nome da casa"
          placeholder="Ex: República dos Amigos"
          value={houseName}
          onChangeText={(text) => {
            setHouseName(text);
            setError('');
          }}
          error={error}
          icon="home"
          editable={!loading}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Criar casa"
          onPress={handleCreate}
          loading={loading}
          disabled={loading || !houseName.trim()}
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
