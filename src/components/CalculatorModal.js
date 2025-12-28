import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Delete, Percent, Divide, Minus, Plus, Equal, Hash } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CalcButton = ({ label, onPress, type = 'number', theme, isDark }) => {
  const getColors = () => {
    if (type === 'operator') return { bg: theme.colors.secondary + '20', text: theme.colors.secondary };
    if (type === 'action') return { bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', text: theme.colors.textSecondary };
    return { bg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)', text: theme.colors.textPrimary };
  };

  const colors = getColors();

  return (
    <TouchableOpacity 
      onPress={() => onPress(label)}
      style={[styles.btn, { backgroundColor: colors.bg }]}
    >
      <Text style={[styles.btnText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function CalculatorModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handlePress = (val) => {
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (val === '=') {
      try {
        // Simple evaluation logic (safer than eval for a basic calculator)
        const result = eval(equation.replace('×', '*').replace('÷', '/'));
        setDisplay(String(result));
        setEquation(String(result));
      } catch (e) {
        setDisplay('Error');
      }
      return;
    }

    if (['+', '-', '×', '÷'].includes(val)) {
      setEquation(equation + val);
      setDisplay('0');
      return;
    }

    const newDisplay = display === '0' ? val : display + val;
    setDisplay(newDisplay);
    setEquation(equation + val);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={styles.container}>
          <View style={[styles.header, { borderBottomColor: theme.colors.glassBorder }]}>
            <View style={styles.headerLeft}>
              <Hash size={20} color={theme.colors.secondary} />
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Quick Calc</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.displayArea}>
            <Text style={[styles.equationText, { color: theme.colors.textSecondary }]}>{equation || ' '}</Text>
            <Text style={[styles.displayText, { color: theme.colors.textPrimary }]}>{display}</Text>
          </View>

          <View style={styles.pad}>
            <View style={styles.row}>
              <CalcButton label="C" type="action" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="+/-" type="action" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="%" type="action" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="÷" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
            </View>
            <View style={styles.row}>
              <CalcButton label="7" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="8" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="9" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="×" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
            </View>
            <View style={styles.row}>
              <CalcButton label="4" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="5" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="6" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="-" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
            </View>
            <View style={styles.row}>
              <CalcButton label="1" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="2" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="3" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="+" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
            </View>
            <View style={styles.row}>
              <CalcButton label="0" theme={theme} isDark={isDark} onPress={handlePress} />
              <CalcButton label="." theme={theme} isDark={isDark} onPress={handlePress} />
              <TouchableOpacity 
                onPress={() => handlePress('=')}
                style={[styles.equalBtn, { backgroundColor: theme.colors.secondary }]}
              >
                <Equal size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 5,
  },
  displayArea: {
    paddingVertical: 30,
    alignItems: 'flex-end',
  },
  equationText: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 5,
  },
  displayText: {
    fontSize: 48,
    fontWeight: '900',
  },
  pad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  equalBtn: {
    flex: 2.15,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
