import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Card } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW, RADIUS } from '../../theme';
import { Feather } from '@expo/vector-icons';
import { HouseStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<HouseStackParamList, 'HouseChoice'>;

export function HouseChoiceScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Onde você mora?</Text>
        <Text style={styles.subtitle}>Escolha como deseja começar.</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.cardContainer} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CreateHouse')}
        >
          <Card style={styles.card}>
            <View style={styles.iconContainer}>
              <Feather name="home" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Criar uma casa nova</Text>
              <Text style={styles.cardDescription}>
                Monte sua casa do zero e convide quem mora com você
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textLight} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cardContainer}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('JoinHouse')}
        >
          <Card style={styles.card}>
            <View style={styles.iconContainer}>
              <Feather name="key" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Já tenho um convite</Text>
              <Text style={styles.cardDescription}>
                Entre em uma casa existente usando um código
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textLight} />
          </Card>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    gap: SPACING.md,
  },
  cardContainer: {
    marginBottom: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
});
