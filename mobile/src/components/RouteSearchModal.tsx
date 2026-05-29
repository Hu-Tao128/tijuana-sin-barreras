import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { searchPlaces, getPlaceDetails } from '../services/google-places-api';
import { GOOGLE_PLACES_API_KEY } from '../services/constants';

interface Place {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
  latitude?: number;
  longitude?: number;
}

interface RouteSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOrigin: (place: Place) => void;
  onSelectDestination: (place: Place) => void;
  apiKey?: string;
}

export default function RouteSearchModal({
  visible,
  onClose,
  onSelectOrigin,
  onSelectDestination,
  apiKey = GOOGLE_PLACES_API_KEY,
}: RouteSearchModalProps) {
  const [searchType, setSearchType] = useState<
    'origin' | 'destination' | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<Place | null>(
    null,
  );
  const [selectedDestination, setSelectedDestination] = useState<
    Place | null
  >(null);

  const handleSearchPlaces = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        const data = await searchPlaces(query, apiKey);

        if (data.predictions) {
          const places: Place[] = data.predictions.map(
            (prediction: any) => ({
              placeId: prediction.place_id,
              description: prediction.description,
              mainText: prediction.structured_formatting.main_text,
              secondaryText:
                prediction.structured_formatting.secondary_text,
            }),
          );

          setSuggestions(places);
        } else if (data.error_message) {
          Alert.alert('Error API', data.error_message);
        }
      } catch (error) {
        console.log('Places search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [apiKey],
  );

  const handlePlaceDetails = useCallback(
    async (placeId: string, place: Place) => {
      try {
        const location = await getPlaceDetails(placeId, apiKey);

        if (location) {
          const placeWithCoords = {
            ...place,
            latitude: location.lat,
            longitude: location.lng,
          };

          if (searchType === 'origin') {
            setSelectedOrigin(placeWithCoords);
            onSelectOrigin(placeWithCoords);
          } else if (searchType === 'destination') {
            setSelectedDestination(placeWithCoords);
            onSelectDestination(placeWithCoords);
          }

          setSearchQuery('');
          setSuggestions([]);
        } else {
          Alert.alert('Error', 'No se pudo obtener la ubicación del lugar');
        }
      } catch (error) {
        console.log('Place details error:', error);
        Alert.alert('Error', 'Error al obtener detalles del lugar');
      }
    },
    [searchType, apiKey, onSelectOrigin, onSelectDestination],
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchType) {
      handleSearchPlaces(text);
    }
  };

  const handleSelectPlace = (place: Place) => {
    handlePlaceDetails(place.placeId, place);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchType(null);
    setSuggestions([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planificar ruta</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          {/* Origen */}
          <TouchableOpacity
            style={styles.searchInput}
            onPress={() => setSearchType('origin')}
          >
            <Ionicons
              name="location"
              size={20}
              color={selectedOrigin ? '#2563eb' : '#999'}
            />
            <Text
              style={[
                styles.searchPlaceholder,
                selectedOrigin && styles.searchText,
              ]}
            >
              {selectedOrigin?.mainText || 'Origen'}
            </Text>
          </TouchableOpacity>

          {/* Botón intercambiar */}
          {selectedOrigin && selectedDestination && (
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                setSelectedOrigin(selectedDestination);
                setSelectedDestination(selectedOrigin);
              }}
            >
              <Ionicons name="swap-vertical" size={20} color="#2563eb" />
            </TouchableOpacity>
          )}

          {/* Destino */}
          <TouchableOpacity
            style={styles.searchInput}
            onPress={() => setSearchType('destination')}
          >
            <Ionicons
              name="pin"
              size={20}
              color={selectedDestination ? '#2563eb' : '#999'}
            />
            <Text
              style={[
                styles.searchPlaceholder,
                selectedDestination && styles.searchText,
              ]}
            >
              {selectedDestination?.mainText || 'Destino'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input de búsqueda activo */}
        {searchType && (
          <View style={styles.activeSearchContainer}>
            <View style={styles.searchInputActive}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder={`Buscar ${searchType === 'origin' ? 'origen' : 'destino'}`}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
              />
              {searchQuery && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de sugerencias */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : (
              <FlatList
                data={suggestions}
                keyExtractor={item => item.placeId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectPlace(item)}
                  >
                    <Ionicons name="location" size={18} color="#666" />
                    <View style={styles.suggestionText}>
                      <Text style={styles.mainText}>
                        {item.mainText}
                      </Text>
                      {item.secondaryText && (
                        <Text style={styles.secondaryText}>
                          {item.secondaryText}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                scrollEnabled
                style={styles.suggestionsList}
              />
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  searchPlaceholder: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#999',
  },

  searchText: {
    color: '#1a1a1a',
    fontWeight: '500',
  },

  swapButton: {
    alignSelf: 'center',
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginHorizontal: 16,
  },

  activeSearchContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  searchInputActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 12,
  },

  textInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#1a1a1a',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  suggestionsList: {
    flex: 1,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  suggestionText: {
    flex: 1,
    marginLeft: 12,
  },

  mainText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },

  secondaryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
