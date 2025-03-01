// App.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Text, Button, Modal, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { heritageSites } from './data';

const App = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSites, setFilteredSites] = useState(heritageSites);
  const [description, setDescription] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Location permission and initial setup
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  // Search functionality fix
  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = heritageSites.filter(site =>
      site.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredSites(filtered);
  }, [searchQuery]);

  // TTS function with error handling
  const handleSpeak = async (text) => {
    try {
      if (isSpeaking) {
        await Speech.stop();
      }
      setIsSpeaking(true);
      await Speech.speak(text, {
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('Speech Error:', error);
      setIsSpeaking(false);
    }
  };

  // Generate description handler
  const generateDescription = (site) => {
    const fullDescription = `${site.name}. ${site.era}. ${site.facts}`;
    setDescription(fullDescription);
    handleSpeak(fullDescription);
  };

  if (!location) {
    return (
      <View style={styles.container}>
        {errorMsg ? <Text>{errorMsg}</Text> : <ActivityIndicator size="large" />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search Coimbatore temples..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude
          }}
          title="Your Location"
          pinColor="#2196F3"
        />

        {/* Temple Markers */}
        {filteredSites.map((site, index) => (
          <Marker
            key={`marker-${index}`}
            coordinate={{ latitude: site.lat, longitude: site.lng }}
            title={site.name}
            description={site.era}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.siteTitle}>{site.name}</Text>
                <Text style={styles.siteEra}>{site.era}</Text>
                <Button
                  title={isSpeaking ? "Stop" : "Hear Story"}
                  onPress={() => generateDescription(site)}
                  color="#4CAF50"
                />
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Description Modal */}
      <Modal
        visible={!!description}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modal}>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.buttonGroup}>
            <Button
              title="Close"
              onPress={() => {
                setDescription('');
                Speech.stop();
              }}
              color="#F44336"
            />
            <Button
              title="Repeat"
              onPress={() => handleSpeak(description)}
              color="#2196F3"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  searchBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    fontSize: 16,
  },
  callout: {
    width: 240,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  siteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  siteEra: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modal: {
    flex: 1,
    padding: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  description: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 24,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
});

export default App;