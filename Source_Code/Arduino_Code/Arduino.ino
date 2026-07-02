#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <DNSServer.h>
#include <HardwareSerial.h>
#include <DFRobotDFPlayerMini.h>

#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define I2C_SDA 21
#define I2C_SCL 22

#define BUTTON_PIN 5
int lastButtonState = HIGH;

const char* ssid = "Proiect_F2";
const char* password = "F2RT_ETTI";

const char* server = "http://192.168.4.2:80/primeste-date";

const byte DNS_PORT = 53;
DNSServer dnsServer;
IPAddress laptopIP(192, 168, 4, 2);

HardwareSerial mySerial(2);
DFRobotDFPlayerMini myDFPlayer;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Wire.begin(I2C_SDA, I2C_SCL);
  mySerial.begin(9600, SERIAL_8N1, 16, 17);

  delay(100);

  lcd.init();
  lcd.backlight();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializare...");
  delay(2000);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Pornire Wi-Fi");
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);
  delay(1500);

  dnsServer.start(DNS_PORT, "www.proiectf2.ro", laptopIP);

  lcd.clear();
  lcd.print("Init DFPlayer...");
  
  if(!myDFPlayer.begin(mySerial)){
    lcd.setCursor(0, 1);
    lcd.print("Eroare Audio!");
    delay(2000);
  }
  else{
    lcd.setCursor(0, 1);
    lcd.print("Audio OK!");
    myDFPlayer.volume(12);
    delay(1500);
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Access Point:");
  lcd.setCursor(0, 1);
  lcd.print(ssid);
  delay(1000);

  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Password:");
  lcd.setCursor(0,1);
  lcd.print(password);
  delay(3000);

  while(digitalRead(BUTTON_PIN) == HIGH){ delay(50); }
  while(digitalRead(BUTTON_PIN) == LOW){ delay(50); }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IP Laptor/Server:");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.softAPIP());
  delay(3000);

  while(digitalRead(BUTTON_PIN) == HIGH){ delay(50); }
  while(digitalRead(BUTTON_PIN) == LOW){ delay(50); }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Pornire senzori...");
  dht.begin();

  if(lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23)){
    lcd.clear();
    lcd.print("Senzori OK!");
    delay(1500);
  }
  else{
    lcd.clear();
    lcd.print("Eroare lumina!");
    delay(1500);
  }

  afisareEcranAsteptare();
}

void loop() {
  // put your main code here, to run repeatedly:
  dnsServer.processNextRequest();

  int currentButtonState = digitalRead(BUTTON_PIN);

  if (lastButtonState == HIGH && currentButtonState == LOW){
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Se citesc senzorii...");
    
    float temperatura = dht.readTemperature();
    float umiditate = dht.readHumidity();
    float lumina = lightMeter.readLightLevel();

    if(!isnan(temperatura) && !isnan(umiditate)){

      String json = "{";
      json +="\"temperatura\":" + String(temperatura) + ",";
      json += "\"umiditate\":" + String(umiditate) + ",";
      json += "\"lumina\":" + String(lumina);
      json += "}";

      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("Se trimit datele...");

      Serial.println("Trimite catre flask: " + json);

      WiFiClient client;
      HTTPClient http;

      http.begin(client, server);
      http.addHeader("Content-Type", "application/json");

      int httpResponseCode = http.POST(json);

      lcd.setCursor(0, 1);
      if(httpResponseCode > 0){
        Serial.print("Succes! Raspuns de la Flask cu codul: ");
        Serial.println(httpResponseCode);

        lcd.print("Succes! Cod ");
        lcd.print(httpResponseCode);
        delay(2000);

        String responseBody = http.getString();

        int trackId = responseBody.toInt();

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("AI Select: ");
        lcd.print(trackId);

        if(trackId >= 1 && trackId <= 3){
          myDFPlayer.play(trackId);
        }

        delay(5000);
      }
      else{
        lcd.clear();
        Serial.print("Eroare cu codul: ");
        Serial.println(httpResponseCode);
        lcd.print("Eroare!");
        delay(2000);
      }

      http.end();
      delay(2000);
    }
    else{
      Serial.println("Eroare la senzori");
      lcd.clear();
      lcd.print("Eroare senzori!");
      delay(2000);
    }

    delay(50);
    afisareEcranAsteptare();
  }

  lastButtonState = currentButtonState;
}

void afisareEcranAsteptare(){
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Gata!");
  lcd.setCursor(0, 1);
  lcd.print("Apasa start!");
}
