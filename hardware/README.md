# 🔧 GuauAI Collar — Hardware Guide

## Diagrama de conexiones

```
                    ┌─────────────┐
                    │  ESP32-S3   │
                    │             │
INMP441 ────────────┤ GPIO14 SCK  │
(Micrófono I2S)     │ GPIO15 WS   │
                    │ GPIO32 SD   │
                    │             │
MPU-6050 ───────────┤ GPIO21 SDA  │
(Acelerómetro)      │ GPIO22 SCL  │
                    │ 3.3V / GND  │
                    │             │
LED RGB ─────────────┤ GPIO38 R   │
                    │ GPIO39 G    │
                    │ GPIO40 B    │
                    │             │
Batería LiPo ───────┤ GPIO35 ADC  │ (nivel batería)
via TP4056          │ 5V / GND    │
                    └─────────────┘
```

## Lista de componentes

| # | Componente | Modelo | Dónde comprar | Precio |
|---|---|---|---|---|
| 1 | Microcontrolador | ESP32-S3 DevKit C N16R8 | AliExpress / Amazon | ~8€ |
| 2 | Micrófono MEMS | INMP441 I2S | AliExpress | ~3€ |
| 3 | Acelerómetro | MPU-6050 GY-521 | AliExpress / Amazon | ~2€ |
| 4 | Batería | LiPo 1000mAh 3.7V con JST | AliExpress | ~4€ |
| 5 | Cargador batería | TP4056 módulo USB-C | AliExpress | ~2€ |
| 6 | LEDs | RGB 5mm cátodo común x3 | AliExpress | ~1€ |
| 7 | Resistencias | 220Ω x3 (para LEDs) | —  | ~0€ |
| 8 | PCB prototipo | Breadboard o perfboard | — | ~2€ |
| 9 | Collar | Collar perro con bolsillo | Amazon | ~10€ |
| **Total** | | | | **~32-40€** |

## Instalación del firmware

### Requisitos
- Arduino IDE 2.x
- Soporte ESP32: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
- Librerías (instalar desde Library Manager):
  - `ArduinoJson` by Benoit Blanchon
  - `ESP32 BLE Arduino` (incluida en ESP32 package)
  - `base64` by Densaugeo

### Pasos
1. Abre `guauai_collar.ino` en Arduino IDE
2. Selecciona board: `ESP32S3 Dev Module`
3. Configura:
   - Flash Size: 16MB
   - Partition Scheme: `Huge APP (3MB No OTA)`
4. Si tienes WiFi fijo, edita `WIFI_SSID` y `WIFI_PASSWORD` en el sketch
5. Si usas la app móvil para configurar, déjalo vacío y usa BLE
6. Sube el sketch y abre Serial Monitor (115200 baud)

## Configuración via BLE

El collar crea un servidor BLE llamado `GuauAI-Collar`. Desde la app o cualquier app BLE genérica, escribe en el characteristic de configuración:

```json
{
  "ssid": "MiWiFi",
  "pass": "MiPassword",
  "dog": "Rex",
  "breed": "Labrador"
}
```

## PCB (próximamente)

Diseño KiCad de PCB compacto para integrar en collar. Se publicará en `/hardware/pcb/`.
