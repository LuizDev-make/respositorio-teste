import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../theme';

interface MemberAvatarProps {
  name: string;
  size?: number;
  color?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = React.memo(({
  name,
  size = 40,
  color = COLORS.primary,
}) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.45,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.white,
  },
});
