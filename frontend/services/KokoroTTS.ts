import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { phonemize } from 'phonemizer';

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

// Kokoro vocabulary - simplified English phoneme set
const VOCAB = [
  '<pad>', '<unk>', '<s>', '</s>',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  ' ', '.', ',', '!', '?', '-', "'",
  'æ', 'ə', 'ɚ', 'ɝ', 'ɪ', 'ɛ', 'ʊ', 'ʌ', 'ɔ', 'ɑ', 'aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ',
  'p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h',
  'm', 'n', 'ŋ', 'l', 'r', 'w', 'j',
];

export class KokoroTTSEngine {
  private modelPath: string | null = null;
  private voicesPath: string | null = null;
  private session: InferenceSession | null = null;
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

  private normalizeText(text: string): string {
    // Normalize text for better TTS
    let normalized = text
      .toLowerCase()
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/[^\w\s.,!?'-]/g, '') // Keep only valid characters
      .trim();

    return normalized;
  }

  private textToPhonemes(text: string): string {
    try {
      // Use phonemizer library for G2P conversion
      const phonemes = phonemize(text, {
        language: 'en-us',
        separator: ' ',
      });
      return phonemes;
    } catch (error) {
      console.error('Phonemization error:', error);
      // Fallback: return original text
      return text;
    }
  }

  private phonemesToTokens(phonemes: string): number[] {
    // Convert phonemes to token IDs based on vocabulary
    const tokens: number[] = [2]; // Start token <s>
    
    const chars = phonemes.split('');
    for (const char of chars) {
      const idx = VOCAB.indexOf(char);
      if (idx >= 0) {
        tokens.push(idx);
      } else {
        tokens.push(1); // Unknown token
      }
    }
    
    tokens.push(3); // End token </s>
    return tokens;
  }

  private generateWAV(audioData: Float32Array, sampleRate: number = 24000): Uint8Array {
    // Create WAV file header + PCM data
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const fileSize = 44 + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Convert float32 audio to int16 PCM
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const intSample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    return new Uint8Array(buffer);
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

      // Initialize ONNX Runtime session
      console.log('Loading ONNX model from:', this.modelPath);
      this.session = await InferenceSession.create(this.modelPath, {
        executionProviders: ['cpu'],
      });
      
      console.log('ONNX session created successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing TTS:', error);
      throw error;
    }
  }

  async synthesize(text: string, config: TTSConfig): Promise<string> {
    if (!this.isInitialized || !this.session) {
      throw new Error('TTS engine not initialized');
    }

    try {
      console.log('Synthesizing text:', text);

      // Step 1: Normalize text
      const normalizedText = this.normalizeText(text);
      console.log('Normalized:', normalizedText);

      // Step 2: Convert to phonemes
      const phonemes = this.textToPhonemes(normalizedText);
      console.log('Phonemes:', phonemes);

      // Step 3: Convert phonemes to token IDs
      const tokens = this.phonemesToTokens(phonemes);
      console.log('Tokens:', tokens.slice(0, 20), '...');

      // Step 4: Create input tensors
      const inputIds = new Tensor('int64', new BigInt64Array(tokens.map(t => BigInt(t))), [1, tokens.length]);
      const speed = new Tensor('float32', new Float32Array([config.speed]), [1]);

      // Step 5: Run ONNX inference
      console.log('Running ONNX inference...');
      const feeds = {
        input_ids: inputIds,
        speed: speed,
      };

      const outputs = await this.session.run(feeds);
      console.log('Inference complete, outputs:', Object.keys(outputs));

      // Step 6: Extract audio waveform
      const waveformKey = Object.keys(outputs)[0];
      const waveform = outputs[waveformKey];
      
      if (!waveform || !waveform.data) {
        throw new Error('No audio output from model');
      }

      const audioData = new Float32Array(waveform.data as ArrayLike<number>);
      console.log('Audio data length:', audioData.length);

      // Step 7: Generate WAV file
      const wavData = this.generateWAV(audioData);

      // Step 8: Save to file
      const audioDir = `${FileSystem.cacheDirectory}audio/`;
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      }

      const audioPath = `${audioDir}tts_${Date.now()}.wav`;
      
      // Convert Uint8Array to base64
      const base64 = this.arrayBufferToBase64(wavData);
      await FileSystem.writeAsStringAsync(audioPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Audio saved to:', audioPath);
      return audioPath;
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      throw error;
    }
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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

  async dispose() {
    if (this.session) {
      await this.session.release();
      this.session = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const ttsEngine = new KokoroTTSEngine();
