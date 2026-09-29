import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenContainer, Button } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

type RouteParams = RouteProp<{ params: { inviteCode: string; houseName: string } }, 'params'>;

export function InviteCodeScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<any>();
  const { inviteCode, houseName } = route.params || { inviteCode: '', houseName: '' };
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    navigation.popToTop();
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>A casa é de vocês</Text>
        <Text style={styles.subtitle}>
          A casa <Text style={styles.houseName}>{houseName}</Text> foi criada! Compartilhe o código abaixo com seus colegas de casa.
        </Text>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Código de convite</Text>
        <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.7}>
          <Text style={styles.codeText}>{inviteCode}</Text>
          <Feather name={copied ? "check" : "copy"} size={24} color={COLORS.primary} />
        </TouchableOpacity>
        {copied && <Text style={styles.copiedText}>Código copiado!</Text>}
      </View>

      <View style={styles.footer}>
        <Button
          title={copied ? "Código copiado!" : "Copiar código"}
          onPress={handleCopy}
          variant="outline"
          style={styles.copyButton}
          icon={copied ? "check" : "copy"}
        />
        <Button
          title="Ir para minha casa"
          onPress={handleContinue}
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
    lineHeight: 24,
  },
  houseName: {
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
  },
  codeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeLabel: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
  },
  codeText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    letterSpacing: 4,
  },
  copiedText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    marginTop: SPACING.md,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  copyButton: {
    marginBottom: SPACING.sm,
  },
});
