import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useGestureTracking } from '@/hooks/useGestureTracking';
import { CardProps } from '@/types';

const Card: React.FC<CardProps> = ({
  title,
  children,
  onPress,
  style,
}) => {
  const { trackTap } = useGestureTracking();

  const handlePress = () => {
    if (onPress) {
      trackTap('card', {
        x: 0,
        y: 0,
      });
      onPress();
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    ...style,
  };

  const CardContent = (
    <View style={cardStyle}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
});

export default Card;