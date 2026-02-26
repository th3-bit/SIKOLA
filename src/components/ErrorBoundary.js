import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The application encountered a critical error. Please take a screenshot of this screen and send it to support.
            </Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error && this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text style={styles.stackTrace}>
                   {this.state.errorInfo.componentStack}
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                 this.setState({ hasError: false });
                 // Optional: Trigger a reload if possible, or just reset state
              }}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEE2E2', // Light red background
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B91C1C',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stackTrace: {
    color: '#555',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
