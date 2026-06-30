import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Hash } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { scale, verticalScale, moderateScale, height as SCREEN_HEIGHT } from '../utils/Scaling';

const { width } = Dimensions.get('window');

const CalcButton = ({ label, onPress, type = 'number', theme, isDark, wide = false }) => {
  const getColors = () => {
    const isDigit = /^[0-9.]$/.test(label);
    
    if (label === '=') {
      return { 
        bg: '#FACC15', 
        text: '#000', 
        border: 'rgba(255,255,255,0.22)' 
      };
    }

    if (label === 'C') {
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        text: '#EF4444',
        border: 'rgba(239, 68, 68, 0.2)'
      };
    }

    if (label === 'ANS') {
      return {
        bg: 'rgba(34, 197, 94, 0.1)',
        text: '#22C55E',
        border: 'rgba(34, 197, 94, 0.2)'
      };
    }
    
    if (type === 'scientific' || type === 'operator' || !isDigit) {
      return { 
        bg: 'rgba(250, 204, 21, 0.08)',
        text: '#FACC15', 
        border: 'rgba(250, 204, 21, 0.15)' 
      };
    }
    
    return { 
      bg: 'rgba(255,255,255,0.20)', 
      text: '#FFF', 
      border: 'rgba(255,255,255,0.15)' 
    };
  };

  const colors = getColors();

  return (
    <TouchableOpacity 
      onPress={() => onPress(label)}
      activeOpacity={0.7}
      style={[
        styles.btn, 
        { 
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 1,
          height: verticalScale(58),
        },
        wide && { flex: 2 }
      ]}
    >
      <Text style={[styles.btnText, { color: colors.text, fontSize: SCREEN_HEIGHT < 700 ? moderateScale(16) : 22 }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function CalculatorModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [showScientific, setShowScientific] = useState(isLargeScreen);
  const [lastAns, setLastAns] = useState('0');

  useEffect(() => {
    if (visible) {
      setShowScientific(isLargeScreen);
    }
  }, [visible, isLargeScreen]);

  const handlePress = (val) => {
    if (val === 'C') {
      setDisplay('0');
      setEquation('');
      return;
    }

    if (val === 'ANS') {
      if (equation.includes('=')) {
        setEquation(lastAns);
        setDisplay(lastAns);
      } else {
        setEquation(prev => prev + lastAns);
        setDisplay(lastAns);
      }
      return;
    }

    if (val === 'DEL') {
      if (equation.includes('=')) return;
      if (display === 'Error') {
        setDisplay('0');
        setEquation('');
        return;
      }
      
      const funcStarts = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'abs(', '√('];
      const foundFunc = funcStarts.find(f => equation.endsWith(f));
      
      if (foundFunc) {
        setEquation(prev => prev.slice(0, -foundFunc.length));
        setDisplay('0');
      } else {
        const newEq = equation.length > 0 ? equation.slice(0, -1) : '';
        setEquation(newEq);
        // Update display to show the tail of the new equation
        if (newEq === '') {
          setDisplay('0');
        } else {
          // Simplistic display update - just show last entered parts
          const parts = newEq.split(/([+\-×÷()^])/);
          setDisplay(parts[parts.length - 1] || '0');
        }
      }
      return;
    }

    if (val === '=') {
      try {
        let mathEq = equation
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/sin\(/g, 'Math.sin(Math.PI/180*')
          .replace(/cos\(/g, 'Math.cos(Math.PI/180*')
          .replace(/tan\(/g, 'Math.tan(Math.PI/180*')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/√\(/g, 'Math.sqrt(')
          .replace(/abs\(/g, 'Math.abs(')
          .replace(/\^/g, '**')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E');
        
        const open = (mathEq.match(/\(/g) || []).length;
        const close = (mathEq.match(/\)/g) || []).length;
        if (open > close) {
          mathEq += ')'.repeat(open - close);
        }

        const result = eval(mathEq);
        const formattedResult = Number.isInteger(result) 
          ? String(result) 
          : parseFloat(result.toFixed(7)).toString();
          
        setDisplay(formattedResult);
        setLastAns(formattedResult);
        setEquation(equation + ' =');
      } catch (e) {
        setDisplay('Error');
      }
      return;
    }

    if (val === '+/-') {
      if (display !== '0' && !isNaN(display)) {
        const flipped = display.startsWith('-') ? display.slice(1) : '-' + display;
        setDisplay(flipped);
        setEquation(prev => {
          const parts = prev.split(/([+\-×÷()^])/);
          parts[parts.length - 1] = flipped;
          return parts.join('');
        });
      }
      return;
    }

    if (val === '%') {
      const num = parseFloat(display);
      if (!isNaN(num)) {
        const result = num / 100;
        setDisplay(String(result));
        setEquation(prev => {
          const parts = prev.split(/([+\-×÷()^])/);
          parts[parts.length - 1] = String(result);
          return parts.join('');
        });
      }
      return;
    }

    if (['sin', 'cos', 'tan', 'log', 'ln', 'abs', '√'].includes(val)) {
      const func = (val === '√' ? '√' : val) + '(';
      if (equation.includes('=')) setEquation(func);
      else setEquation(equation + func);
      setDisplay(func);
      return;
    }

    if (val === 'x²') {
      const add = equation.includes('=') ? display + '^2' : equation + '^2';
      setEquation(add);
      setDisplay('^2');
      return;
    }

    if (val === '1/x') {
      const add = equation.includes('=') ? '1/(' : equation + '1/(';
      setEquation(add);
      setDisplay('1/(');
      return;
    }

    if (['π', 'e'].includes(val)) {
      if (equation.includes('=')) {
        setEquation(val);
        setDisplay(val);
      } else {
        setEquation(equation + val);
        setDisplay(val);
      }
      return;
    }

    if (['+', '-', '×', '÷', '(', ')', '^'].includes(val)) {
      if (equation.includes('=')) setEquation(display + val);
      else setEquation(equation + val);
      if (val !== '(' && val !== ')') setDisplay('0');
      else setDisplay(val);
      return;
    }

    let newDisplay;
    if (equation.includes('=')) {
      newDisplay = val;
      setEquation(val);
    } else {
      const funcStarts = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'abs(', '√('];
      const isPostFunc = funcStarts.some(f => equation.endsWith(f));
      
      newDisplay = (display === '0' || ['(', ')', ...funcStarts].includes(display) || isPostFunc) 
        ? val : display + val;
      setEquation(equation + val);
    }
    setDisplay(newDisplay);
  };

  return (
    <Modal visible={visible} transparent animationType={isLargeScreen ? "fade" : "slide"}>
      <View style={[
        styles.overlay,
        isLargeScreen && { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40 }
      ]}>
        <BlurView intensity={140} tint="dark" style={[
          styles.container,
          isLargeScreen && {
            width: '100%',
            maxWidth: 450,
            borderRadius: 32,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            maxHeight: '90%',
          }
        ]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Hash size={18} color="#FACC15" />
              </View>
              <Text style={styles.title}>Quick Calc</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => setShowScientific(!showScientific)}
                style={[
                  styles.toggleBtn, 
                  { backgroundColor: showScientific ? '#FACC15' : 'rgba(255,255,255,0.15)' }
                ]}
              >
                <Text style={{ 
                  color: showScientific ? '#000' : 'rgba(255,255,255,0.6)', 
                  fontWeight: '800', fontSize: 12
                }}>f(x)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.displayArea}>
            <Text numberOfLines={1} style={styles.equationText}>{equation || ' '}</Text>
            <Text numberOfLines={1} style={styles.displayText}>{display}</Text>
          </View>

          <View style={styles.pad}>
            {showScientific && (
              <>
                <View style={styles.row}>
                  <CalcButton label="sin" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="cos" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="tan" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="log" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="+/-" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
                <View style={styles.row}>
                  <CalcButton label="abs" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="π" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="e" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="√" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="^" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
              </>
            )}

            {showScientific ? (
              <>
                <View style={styles.row}>
                  <CalcButton label="(" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label=")" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="C" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="DEL" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="÷" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
                <View style={styles.row}>
                  <CalcButton label="7" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="8" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="9" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="x²" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="×" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
                <View style={styles.row}>
                  <CalcButton label="4" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="5" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="6" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="1/x" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="-" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
                <View style={styles.row}>
                  <CalcButton label="1" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="2" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="3" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="ln" type="scientific" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="+" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
                <View style={styles.row}>
                  <CalcButton label="0" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="." theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="ANS" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="=" theme={theme} isDark={isDark} onPress={handlePress} wide={true} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <CalcButton label="C" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="DEL" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="%" type="operator" theme={theme} isDark={isDark} onPress={handlePress} />
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
                  <CalcButton label="ANS" theme={theme} isDark={isDark} onPress={handlePress} />
                  <CalcButton label="=" theme={theme} isDark={isDark} onPress={handlePress} />
                </View>
              </>
            )}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
    paddingBottom: verticalScale(40),
    paddingHorizontal: scale(16),
    overflow: 'hidden',
    maxHeight: '95%', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(12),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  iconContainer: {
    padding: scale(6),
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  displayArea: {
    paddingVertical: verticalScale(8),
    alignItems: 'flex-end',
    minHeight: verticalScale(80),
    justifyContent: 'flex-end',
  },
  equationText: {
    fontSize: moderateScale(18),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  displayText: {
    fontSize: SCREEN_HEIGHT < 700 ? moderateScale(36) : moderateScale(48),
    fontWeight: '900',
    color: '#FFF',
    includeFontPadding: false,
  },
  pad: {
    gap: verticalScale(6),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(6),
  },
  btn: {
    flex: 1,
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 22,
    fontWeight: '700',
  },
});
