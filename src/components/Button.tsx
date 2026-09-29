import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = React.memo(({
  title,
  variant = 'primary',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  style,
  ...rest
}) => {
  const getBackgroundStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary': return { backgroundColor: COLORS.primary };
      case 'secondary': return { backgroundColor: COLORS.primaryLight };
      case 'outline': return { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary };
      case 'danger': return { backgroundColor: COLORS.error };
      case 'ghost': return { backgroundColor: 'transparent' };
      default: return { backgroundColor: COLORS.primary };
    }
  };

  const getTextColorStyle = (): TextStyle => {
    switch (variant) {
      case 'primary': return { color: COLORS.white };
      case 'secondary': return { color: COLORS.primary };
      case 'outline': return { color: COLORS.primary };
      case 'danger': return { color: COLORS.white };
      case 'ghost': return { color: COLORS.primary };
      default: return { color: COLORS.white };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getBackgroundStyle(),
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColorStyle().color as string} />
      ) : (
        <>
          {icon && (
            <Feather
              name={icon}
              size={20}
              color={getTextColorStyle().color as string}
              style={styles.icon}
            />
          )}
          <Text style={[styles.title, getTextColorStyle()]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  title: {
    ...TYPOGRAPHY.button,
  },
  icon: {
    marginRight: SPACING.xs,
  },
});
