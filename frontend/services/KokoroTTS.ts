import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Kokoro TTS model URLs from Hugging Face
const MODEL_BASE_URL = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main';
const MODEL_FILES = {
  model_q8: 'model_q8f16.onnx', // 86MB - recommended for mobile
  voices: 'voices.bin',
};

export interface TTSConfig {
  speed: number;
  voice: string;
}

export class KokoroTTSEngine {
  private modelPath: string | null = null;
  private voicesPath: string | null = null;
  private isInitialized: boolean = false;

  async checkModelsDownloaded(): Promise<boolean> {
    try {
      const modelDir = `${FileSystem.documentDirectory}models/`;
      const modelFile = `${modelDir}${MODEL_FILES.model_q8}`;
      const voicesFile = `${modelDir}${MODEL_FILES.voices}`;

      const modelInfo = await FileSystem.getInfoAsync(modelFile);
      const voicesInfo = await FileSystem.getInfoAsync(voicesFile);

      return modelInfo.exists && voicesInfo.exists;
    } catch (error) {
      return false;
    }
  }

  async downloadModels(
    onProgress?: (progress: number, fileName: string) => void
  ): Promise<void> {
    try {
      // Create models directory
      const modelDir = `${FileSystem.documentDirectory}models/`;
      const dirInfo = await FileSystem.getInfoAsync(modelDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
      }

      // Download model file
      const modelUrl = `${MODEL_BASE_URL}/${MODEL_FILES.model_q8}`;
      const modelDestination = `${modelDir}${MODEL_FILES.model_q8}`;
      
      onProgress?.(0, MODEL_FILES.model_q8);
      
      const modelDownload = FileSystem.createDownloadResumable(
        modelUrl,
        modelDestination,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress, MODEL_FILES.model_q8);
        }
      );

      await modelDownload.downloadAsync();
      this.modelPath = modelDestination;

      // Download voices file
      const voicesUrl = `${MODEL_BASE_URL}/${MODEL_FILES.voices}`;
      const voicesDestination = `${modelDir}${MODEL_FILES.voices}`;
      
      onProgress?.(0, MODEL_FILES.voices);
      
      const voicesDownload = FileSystem.createDownloadResumable(
        voicesUrl,
        voicesDestination,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress, MODEL_FILES.voices);
        }
      );

      await voicesDownload.downloadAsync();
      this.voicesPath = voicesDestination;

      Alert.alert('Success', 'Kokoro TTS models downloaded successfully!');
    } catch (error) {
      console.error('Error downloading models:', error);
      throw new Error(`Failed to download models: ${error}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      const modelDir = `${FileSystem.documentDirectory}models/`;
      this.modelPath = `${modelDir}${MODEL_FILES.model_q8}`;
      this.voicesPath = `${modelDir}${MODEL_FILES.voices}`;

      // Verify files exist
      const modelExists = await this.checkModelsDownloaded();
      if (!modelExists) {
        throw new Error('Models not downloaded. Please download models first.');
      }

      // TODO: Initialize ONNX Runtime session here
      // This will be implemented when we integrate onnxruntime-react-native
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing TTS:', error);
      throw error;
    }
  }

  async synthesize(text: string, config: TTSConfig): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('TTS engine not initialized');
    }

    try {
      // TODO: Implement actual TTS synthesis using ONNX Runtime
      // For now, return a placeholder
      
      // 1. Tokenize text
      // 2. Run ONNX inference
      // 3. Convert output to WAV
      // 4. Save and return file path

      const audioDir = `${FileSystem.cacheDirectory}audio/`;
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      }

      const audioPath = `${audioDir}tts_${Date.now()}.wav`;
      
      // Placeholder: This will be replaced with actual TTS generation
      console.log(`Generating TTS for: "${text}" at speed ${config.speed}`);
      
      return audioPath;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  getModelPath(): string | null {
    return this.modelPath;
  }

  getVoicesPath(): string | null {
    return this.voicesPath;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const ttsEngine = new KokoroTTSEngine();
