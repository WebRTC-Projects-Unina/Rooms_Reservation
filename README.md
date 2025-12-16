# SpaceHub 💬

**SpaceHub** è un'applicazione web interattiva progettata per la gestione delle prenotazioni delle aule e lo streaming delle riunioni svolte al loro interno.
Il progetto combina tecnologie di sviluppo web moderne con meccanismi di comunicazione real-time (WebRTC) e integrazione IoT per il controllo accessi fisico.

> **Corso:** Web and Real Time Communication Systems (2025/2026)

## 📋 Indice
- [Descrizione](#-descrizione)
- [Architettura](#-architettura)
- [Tecnologie Utilizzate](#-tecnologie-utilizzate)
- [Setup e Avvio](#-setup-e-avvio)
- [Autori](#-autori-)

## 📖 Descrizione

L’applicazione, dunque, permette agli utenti di registrarsi, autenticarsi, visualizzare le aule disponibili e prenotarne una per una specifica data e fascia oraria.
Il sistema integra due funzionalità avanzate:
1.  **Accesso Fisico:** Al momento dell’ingresso in aula, un sistema di lettura della smart card consente di verificare l’identità dell’utente e autorizzarne l’accesso.
2.  **Streaming Real-Time:** L'host della prenotazione può avviare una videoconferenza (condivisione schermo e audio) accessibile da remoto tramite link pubblico.

## 🏗 Architettura

Il sistema segue un'architettura client-server composta da 5 componenti fondamentali:

1.  **Frontend (React):** Interfaccia utente per la gestione prenotazioni e la visualizzazione dello stream.
2.  **Backend (Node.js):** API RESTful, logica di business MVC, autenticazione e orchestrazione delle stanze per lo streaming.
3.  **Database (MariaDB):** Persistenza dati. 
4.  **Media Server (Janus Gateway):** Gestione dei flussi audio/video WebRTC tramite plugin *VideoRoom*.
5.  **Local Room Server (Python):** Servizio in esecuzione sul lettore fisico che valida le smart card comunicando con il backend tramite messaggi firmati digitalmente.

![Immagine Architettura](Docs/architecture-dark.png)

## 🛠 Tecnologie Utilizzate
* **Frontend:** React, Vite, CSS Modules
* **Backend:** Node.js, Express.js (MVC Pattern)
* **Database:** MariaDB (SQL)
* **Media Server:** Janus WebRTC Gateway (Plugin VideoRoom)
* **IoT/Hardware:** Python, PCSC-tools (Smart Card)

## ⚙️ Setup e Avvio

La guida sul setup dei requisiti necessari ad avviare l'applicazione è riportata sulla documentazione (`/Docs/documentaion.pdf`).
> 💡 **Nota:** La guida è testata su Arch Linux. I comandi potrebbero variare su altre distribuzioni.

Per avviare l'intero sistema, eseguire i componenti in terminali separati:

#### Backend
```bash
cd backend && npm start
```

#### Frontend
```bash
cd frontend && npm run dev
```

#### Media Server
```bash
/opt/janus/bin/janus
```

#### Local Room Server
```bash
cd smart_card_reader
python3 local_reader_service.py
```

> ⚠️ **Importante**: Poiché vengono utilizzati certificati self-signed, al primo avvio è necessario visitare via browser gli indirizzi del Backend, del Frontend e del Media Server per accettare manualmente i certificati di sicurezza.

## 👥 Autori
*  **Annarita Fabiano** (M63001789)
*  **Giuseppe Maglione** (M63001777)
