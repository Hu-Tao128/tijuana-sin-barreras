import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function Input({ label, error, style, onFocus, onBlur, ...rest }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      <Text style={[
        styles.label,
        isFocused && styles.labelFocused,
        error ? styles.labelError : null
      ]}>
        {label}
      </Text>
      
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          style
        ]}
        placeholderTextColor="#767676" // --Neutro-Neutro-600
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161A1D', // --Neutro-Neutro-800 (Texto legible y fuerte)
    marginBottom: 6,
    paddingLeft: 2,
  },
  labelFocused: {
    color: '#611232', // --Text-Text-primary-enabled (El label cambia al color de la app al interactuar)
  },
  labelError: {
    color: '#9B2247', // --Primarios-Guinda-500
  },
  input: {
    backgroundColor: '#FFF', // --Neutro-Neutro-100
    borderWidth: 1.5, // 1.5px le da una estructura más definida y profesional
    borderColor: '#DDD', // --Neutro-Neutro-400
    borderRadius: 8, // Consistente con botones, login y registro
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#161A1D', // --Neutro-Neutro-800
    minHeight: 48,
  },
  inputFocused: {
    borderColor: '#611232', // --Presidencia-principal-600
    // Sutil sombra interna o profundidad simulada al enfocar
    elevation: 1,
    shadowColor: '#611232',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#9B2247', // --Primarios-Guinda-500
    backgroundColor: '#FFF',
  },
  errorText: {
    color: '#9B2247', // --Primarios-Guinda-500
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
    paddingLeft: 4,
  },
});