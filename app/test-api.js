import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Constants from "expo-constants";

export default function TestAPIKeyScreen() {
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const checkApiKey = () => {
      console.log('🔍 [DEBUG] Constants object:', JSON.stringify(Constants, null, 2));
      
      const apiKey = Constants?.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;
      const hfKey = Constants?.expoConfig?.extra?.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
      
      setDebugInfo({
        constantsStructure: {
          hasExpoConfig: !!Constants?.expoConfig,
          hasManifest: !!Constants?.manifest,
          hasManifest2: !!Constants?.manifest2,
          appOwnership: Constants?.appOwnership,
          expoConfig: Constants?.expoConfig ? 'Exists' : 'Missing',
          manifest: Constants?.manifest ? 'Exists' : 'Missing',
          manifest2: Constants?.manifest2 ? 'Exists' : 'Missing',
        },
        gemini: {
          found: !!apiKey,
          length: apiKey ? apiKey.length : 0,
          preview: apiKey ? `${apiKey.substring(0, Math.min(10, apiKey.length))}...` : 'N/A'
        },
        huggingface: {
          found: !!hfKey,
          length: hfKey ? hfKey.length : 0,
          preview: hfKey ? `${hfKey.substring(0, Math.min(10, hfKey.length))}...` : 'N/A'
        },
        fullExpoConfig: Constants?.expoConfig
      });
    };

    checkApiKey();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Key Debug Information</Text>
      
      {debugInfo ? (
        <View>
          <Text style={styles.sectionTitle}>Constants Structure:</Text>
          {Object.entries(debugInfo.constantsStructure).map(([key, value]) => (
            <Text key={key} style={styles.infoText}>{key}: {JSON.stringify(value)}</Text>
          ))}
          
          <Text style={styles.sectionTitle}>Gemini API Key:</Text>
          <Text style={styles.infoText}>Found: {debugInfo.gemini.found ? '✅ Yes' : '❌ No'}</Text>
          <Text style={styles.infoText}>Length: {debugInfo.gemini.length}</Text>
          <Text style={styles.infoText}>Preview: {debugInfo.gemini.preview}</Text>
          
          <Text style={styles.sectionTitle}>Hugging Face API Key:</Text>
          <Text style={styles.infoText}>Found: {debugInfo.huggingface.found ? '✅ Yes' : '❌ No'}</Text>
          <Text style={styles.infoText}>Length: {debugInfo.huggingface.length}</Text>
          <Text style={styles.infoText}>Preview: {debugInfo.huggingface.preview}</Text>
          
          <Text style={styles.sectionTitle}>Full Expo Config:</Text>
          <Text style={styles.infoText}>{JSON.stringify(debugInfo.fullExpoConfig, null, 2)}</Text>
        </View>
      ) : (
        <Text>Loading debug information...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});