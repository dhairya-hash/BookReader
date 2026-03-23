import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'My Books',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="reader" 
          options={{ 
            title: 'Reader',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="model-setup" 
          options={{ 
            title: 'TTS Model Setup',
            headerShown: true
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
