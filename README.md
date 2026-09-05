# Nguvu Pamoja Online Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Tests-39%20Passed-brightgreen.svg)](#testing)

An open-source companion platform for **Nguvu Pamoja** (a Fountwood Community Support Program). This project extends in-person weekly support sessions to online participants—providing an 8-week curriculum, embedded video meeting rooms, weekly check-in rituals, private reflection journaling, and gender-separated discussion spaces.

---

## 🌟 Key Features

- 📖 **8-Week Guided Curriculum**: Themes, scriptures, look-back/look-up prompts, and closing prayers.
- 🎥 **Embedded Video Meetings**: Integrated Jitsi Meet rooms for weekly live sessions without login barriers.
- 📝 **Private Check-ins & Reflections**: Participant-isolated reflections secured via anonymous 3-word tokens.
- 💬 **Gender-Separated Community Forum**: Passphrase-gated spaces (`mens` and `womens`) with XSS sanitization and moderation flagging.
- 🔒 **Privacy First**: Zero PII collected; identity managed purely through client-side 3-word tokens.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Execution
```bash
# Clone repository
git clone https://github.com/your-username/Pamoja-Online.git
cd Pamoja-Online

# Install dependencies
npm install

# Start development server
npm start
# -> Site running at http://localhost:8080/

# Run complete verification test suite
npm test
```

---

## 📚 Documentation Index

Each document in this repository fulfills a single dedicated purpose:

| Document | Purpose |
|---|---|
| 🛠️ **[Developer Guide](docs/developer-guide.md)** | Technical architecture breakdown, subsystem deep dives, and step-by-step instructions on how to extend the codebase. |
| 📋 **[Architecture Source of Truth (SOT)](docs/nguvu-pamoja-sot.md)** | Canonical authority on product decisions, security model, and data schemas. |
| 🗺️ **[Implementation Plan](docs/nguvu-pamoja-implementation-plan.md)** | Historical sprint sequencing and operational maintenance checklists. |
| 🤝 **[Contributing Guidelines](CONTRIBUTING.md)** | Rules for open-source contributions, code style, and security constraints. |
| 🤖 **[Agent System Prompt](AGENTS.md)** | Operational guidelines for AI coding assistants working in this repository. |
| 📂 **[Documentation Hub](docs/README.md)** | Directory index mapping doc ownership across the project. |

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
