import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer, Button, Card, MemberAvatar } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme';
import { useHouse } from '../../contexts/HouseContext';
import { useAuth } from '../../contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export function HouseInfoScreen() {
  const { house, members } = useHouse();
  const { signOut } = useAuth();

  const handleCopyCode = async () => {
    if (house?.inviteCode) {
      await Clipboard.setStringAsync(house.inviteCode);
      Alert.alert('Sucesso', 'Código copiado para a área de transferência!');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut }
      ]
    );
  };

  if (!house) return null;

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Feather name="home" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{house.name}</Text>
        </View>

        <Card style={styles.codeCard}>
          <Text style={styles.sectionTitle}>Código de convite</Text>
          <Text style={styles.sectionDescription}>
            Compartilhe este código para convidar novas pessoas para sua casa.
          </Text>
          
          <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode} activeOpacity={0.7}>
            <Text style={styles.codeText}>{house.inviteCode}</Text>
            <Feather name="copy" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </Card>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Moradores ({members.length})</Text>
          
          {members.map(member => (
            <View key={member.id} style={styles.memberItem}>
              <MemberAvatar name={member.displayName} size={48} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.displayName}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button
          title="Convidar morador"
          onPress={handleCopyCode}
          variant="outline"
          icon="user-plus"
          style={styles.inviteButton}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Sair do aplicativo"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  codeCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  membersSection: {
    marginBottom: SPACING.xl,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.text,
  },
  memberEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
  inviteButton: {
    marginBottom: SPACING.xl,
  },
  footer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButton: {
    borderColor: COLORS.error,
  }
});
