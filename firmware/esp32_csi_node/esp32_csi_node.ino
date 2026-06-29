#include <WiFi.h>
#include <esp_wifi.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* udpAddress = "192.168.1.100"; // Backend IP
const int udpPort = 8765;

WiFiUDP udp;

void csi_cb(void *ctx, wifi_csi_info_t *data) {
  // Extract CSI data and send over UDP
  wifi_csi_info_t d = data[0];
  if (d.buf) {
    udp.beginPacket(udpAddress, udpPort);
    // Send raw bytes. In a real app, package with Timestamp, Node ID, RSSI.
    udp.write(d.buf, d.len);
    udp.endPacket();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected.");

  ESP_ERROR_CHECK(esp_wifi_set_csi(1));
  wifi_csi_config_t configuration_csi;
  configuration_csi.lltf_en = 1;
  configuration_csi.htltf_en = 1;
  configuration_csi.stbc_htltf2_en = 1;
  configuration_csi.ltf_merge_en = 1;
  configuration_csi.channel_filter_en = 1;
  configuration_csi.manu_scale = 0;
  configuration_csi.cb_mac_en = 1;
  ESP_ERROR_CHECK(esp_wifi_set_csi_config(&configuration_csi));
  ESP_ERROR_CHECK(esp_wifi_set_csi_rx_cb(&csi_cb, NULL));
}

void loop() {
  // Ping gateway to generate traffic (Active Sensing)
  delay(50); // 20Hz ping loop
}
