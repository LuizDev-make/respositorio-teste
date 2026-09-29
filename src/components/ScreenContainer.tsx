import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = React.memo(({
  children,
  scroll = true,
  padding = true,
  style,
}) => {
  const content = (
    <View style={[styles.content, padding && styles.padding, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  padding: {
    padding: SPACING.md,
  },
});
