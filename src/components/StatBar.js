
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PURPLE = '#7C3AED';

export default function StatBar({
  label,
  value = 0,
  maxValue = 255,
}) {
  const safeValue = Math.max(0, Number(value) || 0);
  const percentage = Math.min(
    (safeValue / maxValue) * 100,
    100
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%` },
          ]}
        />
      </View>

      <Text style={styles.value}>{safeValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 7,
  },
  label: {
    width: 100,
    fontSize: 12,
    color: '#625B71',
    fontWeight: '600',
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: PURPLE,
    borderRadius: 8,
  },
  value: {
    width: 35,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#241044',
  },
});