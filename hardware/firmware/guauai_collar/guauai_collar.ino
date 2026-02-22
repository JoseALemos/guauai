/**
 * GuauAI Collar Firmware v0.1
 * 
 * Hardware:
 *   - ESP32-S3 DevKit
 *   - Micrófono MEMS I2S: INMP441 (WS=GPIO15, SCK=GPIO14, SD=GPIO32)
 *   - Acelerómetro: MPU-6050 (SDA=GPIO21, SCL=GPIO22)
 *   - LED RGB: GPIO38 (R), GPIO39 (G), GPIO40 (B)
 *   - Batería: LiPo + TP4056 en GPIO35 (ADC nivel batería)
 * 
 * Funcionalidad:
 *   1. Captura audio via I2S cuando hay sonido (umbral configurable)
 *   2. Lee acelerómetro para detectar actividad física
 *   3. Envía datos al backend GuauAI por WiFi (HTTP POST)
 *   4. LED indica estado: azul=idle, verde=analizando, rojo=error, blanco=conectando
 *   5. BLE advertising para configuración desde app móvil
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "base64.h"

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────────
#define WIFI_SSID        ""           // Configurar via BLE app
#define WIFI_PASSWORD    ""
#define API_ENDPOINT     "https://dogspeak-production.up.railway.app/api/audio/analyze-base64"
#define DOG_NAME         "MiPerro"
#define DOG_BREED        ""

// I2S Micrófono INMP441
#define I2S_WS           15
#define I2S_SCK          14
#define I2S_SD           32
#define I2S_PORT         I2S_NUM_0
#define SAMPLE_RATE      16000
#define SAMPLE_BITS      32
#define RECORD_SECONDS   3
#define BUFFER_SIZE      (SAMPLE_RATE * RECORD_SECONDS)

// Acelerómetro MPU-6050
#define MPU_ADDR         0x68
#define MPU_SDA          21
#define MPU_SCL          22

// LED RGB
#define LED_R            38
#define LED_G            39
#define LED_B            40

// Audio
#define SILENCE_THRESHOLD 2000        // Umbral de ruido para activar grabación
#define COOLDOWN_MS       3000        // Espera entre análisis

// BLE UUIDs
#define SERVICE_UUID     "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CONFIG_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define STATUS_CHAR_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a9"

// ─── VARIABLES GLOBALES ──────────────────────────────────────────────────────
int32_t  audioBuffer[BUFFER_SIZE];
int16_t  audioSamples[BUFFER_SIZE];
String   wifiSSID     = WIFI_SSID;
String   wifiPassword = WIFI_PASSWORD;
bool     wifiConfigured = false;
unsigned long lastAnalysis = 0;

BLECharacteristic* statusCharacteristic = nullptr;

// ─── LED ────────────────────────────────────────────────────────────────────
void setLED(int r, int g, int b) {
  analogWrite(LED_R, r);
  analogWrite(LED_G, g);
  analogWrite(LED_B, b);
}

void ledBlue()    { setLED(0, 0, 255); }    // Idle / esperando sonido
void ledGreen()   { setLED(0, 255, 0); }    // Analizando
void ledRed()     { setLED(255, 0, 0); }    // Error
void ledWhite()   { setLED(255, 255, 255); } // Conectando WiFi
void ledPurple()  { setLED(128, 0, 255); }  // BLE activo
void ledOff()     { setLED(0, 0, 0); }

// ─── I2S MICRÓFONO ──────────────────────────────────────────────────────────
void setupI2S() {
  i2s_config_t config = {
    .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate          = SAMPLE_RATE,
    .bits_per_sample      = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format       = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count        = 8,
    .dma_buf_len          = 512,
    .use_apll             = false,
    .tx_desc_auto_clear   = false,
    .fixed_mclk           = 0
  };
  i2s_pin_config_t pins = {
    .bck_io_num   = I2S_SCK,
    .ws_io_num    = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num  = I2S_SD
  };
  i2s_driver_install(I2S_PORT, &config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pins);
  i2s_start(I2S_PORT);
}

// Leer nivel de audio para detectar actividad
int32_t readAudioLevel() {
  size_t bytesRead;
  int32_t sample[64];
  i2s_read(I2S_PORT, sample, sizeof(sample), &bytesRead, 100);
  int32_t maxVal = 0;
  for (int i = 0; i < 64; i++) {
    int32_t abs_val = abs(sample[i] >> 14);
    if (abs_val > maxVal) maxVal = abs_val;
  }
  return maxVal;
}

// Grabar audio completo
int recordAudio() {
  size_t bytesRead;
  int totalSamples = 0;
  unsigned long startTime = millis();
  
  while (totalSamples < BUFFER_SIZE && (millis() - startTime) < (RECORD_SECONDS * 1000 + 500)) {
    int32_t buf[64];
    i2s_read(I2S_PORT, buf, sizeof(buf), &bytesRead, 100);
    int n = bytesRead / 4;
    for (int i = 0; i < n && totalSamples < BUFFER_SIZE; i++) {
      audioBuffer[totalSamples++] = buf[i];
    }
  }
  
  // Convertir de 32bit I2S a 16bit PCM
  for (int i = 0; i < totalSamples; i++) {
    audioSamples[i] = (int16_t)(audioBuffer[i] >> 14);
  }
  return totalSamples;
}

// ─── ACELERÓMETRO MPU-6050 ──────────────────────────────────────────────────
void setupMPU() {
  Wire.begin(MPU_SDA, MPU_SCL);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1
  Wire.write(0);     // Wake up
  Wire.endTransmission(true);
}

struct MotionData {
  float accelX, accelY, accelZ;
  float activity;  // 0.0-1.0
};

MotionData readMotion() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);  // ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  
  int16_t ax = (Wire.read() << 8) | Wire.read();
  int16_t ay = (Wire.read() << 8) | Wire.read();
  int16_t az = (Wire.read() << 8) | Wire.read();
  
  float gx = ax / 16384.0;
  float gy = ay / 16384.0;
  float gz = az / 16384.0;
  
  float activity = (abs(gx) + abs(gy) + abs(gz - 1.0)) / 3.0;
  return { gx, gy, gz, min(activity, 1.0f) };
}

// ─── WIFI ────────────────────────────────────────────────────────────────────
bool connectWiFi() {
  if (wifiSSID.length() == 0) return false;
  ledWhite();
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
  return WiFi.status() == WL_CONNECTED;
}

// ─── API CALL ────────────────────────────────────────────────────────────────
void sendToGuauAI(int numSamples, MotionData motion) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  ledGreen();
  
  // Crear header WAV en memoria
  // (16-bit PCM, 1 canal, 16000 Hz)
  uint32_t dataSize    = numSamples * 2;
  uint32_t chunkSize   = 36 + dataSize;
  uint8_t  wavHeader[44];
  memcpy(wavHeader,      "RIFF", 4);
  memcpy(wavHeader +  4, &chunkSize, 4);
  memcpy(wavHeader +  8, "WAVE", 4);
  memcpy(wavHeader + 12, "fmt ", 4);
  uint32_t subchunk1 = 16; memcpy(wavHeader + 16, &subchunk1, 4);
  uint16_t audioFmt  = 1;  memcpy(wavHeader + 20, &audioFmt, 2);
  uint16_t channels  = 1;  memcpy(wavHeader + 22, &channels, 2);
  uint32_t sr        = SAMPLE_RATE; memcpy(wavHeader + 24, &sr, 4);
  uint32_t byteRate  = SAMPLE_RATE * 2; memcpy(wavHeader + 28, &byteRate, 4);
  uint16_t blockAln  = 2;  memcpy(wavHeader + 32, &blockAln, 2);
  uint16_t bitsPerSample = 16; memcpy(wavHeader + 34, &bitsPerSample, 2);
  memcpy(wavHeader + 36, "data", 4);
  memcpy(wavHeader + 40, &dataSize, 4);

  // Base64 encode (header + PCM data)
  size_t totalBytes = 44 + dataSize;
  uint8_t* rawData = (uint8_t*)malloc(totalBytes);
  if (!rawData) { ledRed(); return; }
  
  memcpy(rawData, wavHeader, 44);
  memcpy(rawData + 44, audioSamples, dataSize);
  
  String b64 = base64::encode(rawData, totalBytes);
  free(rawData);

  // Construir JSON
  DynamicJsonDocument doc(1024);
  doc["audio_base64"] = b64;
  doc["mime_type"]    = "audio/wav";
  doc["dog_name"]     = DOG_NAME;
  doc["dog_breed"]    = DOG_BREED;
  doc["device"]       = "guauai-collar";
  doc["battery_pct"]  = map(analogRead(35), 0, 4095, 0, 100);
  doc["activity"]     = motion.activity;
  
  String payload;
  serializeJson(doc, payload);

  // HTTP POST
  HTTPClient http;
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  
  if (code == 200) {
    String response = http.getString();
    DynamicJsonDocument resp(2048);
    deserializeJson(resp, response);
    
    String emotion = resp["analysis"]["estado_emocional"] | "desconocido";
    String message = resp["analysis"]["mensaje_interpretado"] | "";
    float confidence = resp["analysis"]["confianza"] | 0.0;
    
    Serial.printf("[GuauAI] %s (%.0f%%) — %s\n", emotion.c_str(), confidence * 100, message.c_str());
    
    // Notificar por BLE si hay app conectada
    if (statusCharacteristic) {
      DynamicJsonDocument bleDoc(512);
      bleDoc["e"] = emotion;
      bleDoc["c"] = confidence;
      bleDoc["m"] = message;
      String bleMsg; serializeJson(bleDoc, bleMsg);
      statusCharacteristic->setValue(bleMsg.c_str());
      statusCharacteristic->notify();
    }
    
    // LED según emoción
    if (emotion == "feliz" || emotion == "excitado" || emotion == "juguetón")  ledGreen();
    else if (emotion == "ansioso" || emotion == "asustado" || emotion == "dolorido") ledRed();
    else ledBlue();
    
    delay(2000);
  } else {
    Serial.printf("[GuauAI] Error HTTP: %d\n", code);
    ledRed(); delay(1000);
  }
  
  http.end();
}

// ─── BLE CONFIGURACIÓN ──────────────────────────────────────────────────────
class ConfigCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* chr) override {
    String val = chr->getValue().c_str();
    // Formato esperado: {"ssid":"...","pass":"...","dog":"...","breed":"..."}
    DynamicJsonDocument doc(256);
    if (deserializeJson(doc, val) == DeserializationError::Ok) {
      if (doc.containsKey("ssid"))  wifiSSID     = doc["ssid"].as<String>();
      if (doc.containsKey("pass"))  wifiPassword = doc["pass"].as<String>();
      wifiConfigured = true;
      Serial.println("[BLE] Config recibida. Reconectando WiFi...");
      connectWiFi();
    }
  }
};

void setupBLE() {
  BLEDevice::init("GuauAI-Collar");
  BLEServer* server = BLEDevice::createServer();
  BLEService* service = server->createService(SERVICE_UUID);
  
  BLECharacteristic* configChr = service->createCharacteristic(
    CONFIG_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  configChr->setCallbacks(new ConfigCallbacks());
  
  statusCharacteristic = service->createCharacteristic(
    STATUS_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  statusCharacteristic->addDescriptor(new BLE2902());
  
  service->start();
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("[BLE] Advertising activo — SSID: GuauAI-Collar");
}

// ─── SETUP & LOOP ────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n🐾 GuauAI Collar v0.1 — Iniciando...");
  
  // LEDs
  pinMode(LED_R, OUTPUT); pinMode(LED_G, OUTPUT); pinMode(LED_B, OUTPUT);
  ledWhite();
  
  // I2S Micrófono
  setupI2S();
  Serial.println("[I2S] Micrófono listo");
  
  // Acelerómetro
  setupMPU();
  Serial.println("[MPU] Acelerómetro listo");
  
  // BLE
  setupBLE();
  ledPurple();
  
  // WiFi
  if (strlen(WIFI_SSID) > 0) {
    if (connectWiFi()) {
      Serial.printf("[WiFi] Conectado: %s\n", WiFi.localIP().toString().c_str());
      ledBlue();
    } else {
      Serial.println("[WiFi] Error — modo solo BLE");
      ledRed(); delay(1000); ledPurple();
    }
  } else {
    Serial.println("[WiFi] Sin config — configura via BLE");
  }
  
  Serial.println("✅ Sistema listo. Esperando ladridos...");
  ledBlue();
}

void loop() {
  int32_t level = readAudioLevel();
  
  if (level > SILENCE_THRESHOLD) {
    unsigned long now = millis();
    if (now - lastAnalysis < COOLDOWN_MS) return;
    lastAnalysis = now;
    
    Serial.printf("[Audio] Sonido detectado (nivel: %d) — grabando...\n", level);
    
    MotionData motion = readMotion();
    int samples = recordAudio();
    
    Serial.printf("[Audio] %d muestras grabadas. Enviando a API...\n", samples);
    
    if (WiFi.status() == WL_CONNECTED) {
      sendToGuauAI(samples, motion);
    } else {
      // Intentar reconectar
      connectWiFi();
    }
    
    ledBlue();
  }
  
  delay(50);
}
