import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface LocationPermissionModalProps {
  visible: boolean;
  onActivate: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const { height } = Dimensions.get('window');

export default function LocationPermissionModal({
  visible,
  onActivate,
  onCancel,
  title = 'Para continuar, el dispositivo necesita usar la Precisión de la ubicación',
  message = 'Debes activar los siguientes parámetros de configuración:\n\n• Ubicación del dispositivo\n• La Precisión de la ubicación, que proporciona una ubicación más precisa.',
}: LocationPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Fondo oscuro semitransparente */}
      <View style={styles.overlay}>
        {/* Modal container */}
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* Icono de ubicación */}
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={32} color="#fff" />
            </View>

            {/* Scroll para contenido largo */}
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Título principal */}
              <Text style={styles.title}>{title}</Text>

              {/* Parámetros a activar */}
              <View style={styles.parametersContainer}>
                {/* Ubicación del dispositivo */}
                <View style={styles.parameterItem}>
                  <View style={styles.parameterIcon}>
                    <Ionicons
                      name="location-sharp"
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.parameterTitle}>
                    Ubicación del dispositivo
                  </Text>
                </View>

                {/* Precisión de ubicación */}
                <View style={styles.parameterItem}>
                  <View style={styles.parameterIcon}>
                    <Ionicons
                      name="radio-button-on"
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.parameterTitle}>
                    La Precisión de la ubicación
                  </Text>
                </View>
              </View>

              {/* Mensaje descriptivo */}
              <Text style={styles.description}>
                {message}
              </Text>

              {/* Nota al pie */}
              <Text style={styles.footer}>
                Puedes cambiar estas opciones en cualquier momento en la
                configuración de ubicación.
              </Text>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>No, gracias</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.activateButton}
                onPress={onActivate}
                activeOpacity={0.7}
              >
                <Text style={styles.activateButtonText}>Activar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  modalView: {
    width: '85%',
    maxHeight: height * 0.75,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  iconContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },

  scrollContent: {
    maxHeight: height * 0.4,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 24,
  },

  parametersContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },

  parameterItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  parameterIcon: {
    marginRight: 12,
    marginTop: 2,
  },

  parameterTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 20,
  },

  description: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 19,
    marginBottom: 12,
  },

  footer: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  buttonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#666',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  activateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#b366d9',
  },

  activateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
