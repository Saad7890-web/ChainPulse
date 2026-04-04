<div align="center">

# 🚚 ShipTrack — Real-Time Shipment Tracking & Alert System

**A scalable, event-driven backend system that tracks shipments in real-time, detects delays or anomalies, and pushes instant alerts to a live dashboard.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-Event%20Streaming-231F20?style=flat-square&logo=apachekafka)](https://kafka.apache.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%2F%20Pub--Sub-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 Overview

ShipTrack is a **microservices-based logistics platform** inspired by real-world delivery tracking systems. It simulates GPS-driven shipment tracking — processing live location updates, detecting issues like delays or route deviations, and pushing real-time notifications to end users via a live dashboard.

This project is designed to demonstrate production-grade system design skills including event-driven architecture, inter-service communication via Kafka, and real-time WebSocket/Redis broadcasting.

---

## 🎯 MVP Features

| Feature              | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| 📦 Shipment Tracking | Create and manage shipments with origin, destination, and live status |
| 📍 Location Updates  | Receive and persist GPS coordinates from trucks in real time          |
| 🚨 Anomaly Detection | Rule-based alerts for delays (>30 min no update) and route deviations |
| 🔔 Instant Alerts    | Alerts generated and pushed to users when anomalies are detected      |
| 📊 Live Dashboard    | Real-time UI updates via Redis Pub/Sub or WebSockets                  |

---

## 🧩 System Architecture

```
┌─────────────────────────────────┐
│        Frontend Dashboard       │  ← React (optional)
└────────────────┬────────────────┘
                 │ HTTP / WebSocket
┌────────────────▼────────────────┐
│     API Gateway / Backend       │  ← Node.js + Express
└────────────────┬────────────────┘
                 │ Produce Events
┌────────────────▼────────────────┐
│         Apache Kafka            │  ← Event Streaming Bus
└──┬─────────────┬───────────┬────┘
   │             │           │
   ▼             ▼           ▼
Shipment     Tracking     Alert
Service      Service      Service
   │             │           │
   └─────────────┴───────────┘
                 │
    ┌────────────▼────────────┐
    │   PostgreSQL + Redis    │  ← Persistence + Cache/Pub-Sub
    └─────────────────────────┘
```

---

## 🔁 Data Flow

```
1. 🚚  Truck sends GPS coordinates
2. 📍  Tracking Service receives the location update
3. 📡  `LocationUpdated` event is published to Kafka
4. ⚙️   Microservices consume the event independently
5. 💾  Location is persisted to PostgreSQL
6. 🚨  Alert Service checks for delays or deviations
7. ⚡  Redis Pub/Sub or WebSocket pushes update to dashboard
```

---

## ⚙️ Microservices

### 🚚 Shipment Service

Manages the lifecycle of a shipment.

- Create a new shipment
- Update shipment status (`pending` → `in_transit` → `delivered`)

### 📍 Tracking Service

The real-time location pipeline.

- Receive GPS updates from vehicles
- Validate and persist location data
- Publish `LocationUpdated` events to Kafka

### 🚨 Alert Service

Monitors shipment health and generates alerts.

- Subscribe to tracking events
- Detect delays (no update for 30+ minutes) and route deviations
- Emit `ShipmentDelayed` events and persist alerts

### 👤 User Service

Handles identity and authentication.

- User registration and login
- JWT-based session management

---

## 📡 Kafka Event Design

The system is **loosely coupled** — services communicate exclusively through Kafka topics.

| Event             | Producer         | Consumers        |
| ----------------- | ---------------- | ---------------- |
| `ShipmentCreated` | Shipment Service | Tracking, Alert  |
| `LocationUpdated` | Tracking Service | Alert, Dashboard |
| `ShipmentDelayed` | Alert Service    | User, Dashboard  |

**Example — `LocationUpdated` event payload:**

```json
{
  "shipmentId": 101,
  "latitude": 23.78,
  "longitude": 90.41,
  "timestamp": "2026-04-04T10:00:00Z"
}
```

---

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Shipments
CREATE TABLE shipments (
  id          SERIAL PRIMARY KEY,
  origin      VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  status      VARCHAR(50)  NOT NULL DEFAULT 'pending'
);

-- Location history
CREATE TABLE locations (
  id          SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  latitude    DECIMAL(9,6) NOT NULL,
  longitude   DECIMAL(9,6) NOT NULL,
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id          SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  type        VARCHAR(100) NOT NULL,
  message     TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 🚨 Alert Detection Logic (MVP)

Simple rule-based detection — no ML required at this stage.

```
IF last location update > 30 minutes ago  →  Trigger DELAY alert
IF current position deviates from route   →  Trigger DEVIATION alert
```

---

## 🔌 API Reference

### Shipment Endpoints

| Method | Endpoint         | Description                |
| ------ | ---------------- | -------------------------- |
| `POST` | `/shipments`     | Create a new shipment      |
| `GET`  | `/shipments/:id` | Get shipment details by ID |

### Tracking Endpoints

| Method | Endpoint           | Description                  |
| ------ | ------------------ | ---------------------------- |
| `POST` | `/location-update` | Submit a GPS location update |

### Alert Endpoints

| Method | Endpoint  | Description                |
| ------ | --------- | -------------------------- |
| `GET`  | `/alerts` | Retrieve all active alerts |

---

## 🛠️ Tech Stack

| Layer           | Technology         |
| --------------- | ------------------ |
| Backend API     | Node.js + Express  |
| Event Streaming | Apache Kafka       |
| Database        | PostgreSQL         |
| Cache / Pub-Sub | Redis              |
| Frontend        | React _(optional)_ |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- Redis
- Apache Kafka

### 1. Clone the repository

```bash
git clone https://github.com/your-username/shiptrack.git
cd shiptrack
```

### 2. Start infrastructure with Docker

```bash
docker-compose up -d
# Starts Kafka, Zookeeper, PostgreSQL, and Redis
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your DB credentials, Kafka broker URL, etc.
```

### 4. Install dependencies and run services

```bash
# From each service directory
cd services/shipment-service && npm install && npm start
cd services/tracking-service && npm install && npm start
cd services/alert-service    && npm install && npm start
cd services/user-service     && npm install && npm start
```

---

## 📁 Project Structure

```
shiptrack/
├── services/
│   ├── shipment-service/
│   ├── tracking-service/
│   ├── alert-service/
│   └── user-service/
├── shared/
│   ├── kafka/          # Kafka producer/consumer helpers
│   └── db/             # Shared DB connection utils
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔮 Roadmap

- [ ] 🤖 AI-based delay prediction (ML model integration)
- [ ] 🗺️ Smart route optimization
- [ ] 📱 Mobile tracking app (React Native)
- [ ] 🌍 Multi-region deployment
- [ ] 🔐 Advanced authentication (JWT + RBAC)
- [ ] 📈 Prometheus + Grafana observability stack
- [ ] 🧪 Full test coverage (unit + integration)

---

## 💡 Why This Project?

ShipTrack demonstrates core skills that matter in backend and distributed systems engineering:

- **Event-driven architecture** with decoupled, independently deployable services
- **Real-time data pipelines** using Kafka for high-throughput event streaming
- **Microservices communication** patterns (pub/sub, async events)
- **Scalable system design** following real-world logistics platform patterns

It serves as a strong portfolio piece for backend engineering and distributed systems roles.

---

## 🧑‍💻 Author

**Saad Islam Omy**
Backend Engineer · Distributed Systems Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-SaadIslamOmy-181717?style=flat-square&logo=github)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/your-profile)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
