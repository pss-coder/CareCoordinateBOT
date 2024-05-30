# Telegram Bot Coordinator for FHIR Medical App Setup

<img src="https://github.com/pss-coder/CareCoordinateBOT/assets/22881285/fcab2c81-134d-41f2-bf97-7d8c27220d31" height="400">

## Introduction

This repository provides requires a FHIR-based server using [Bonfhir](https://bonfhir.dev/). Additionally, it demonstrates how to integrate [Socket.IO](https://socket.io/) and [Telegraf](https://github.com/telegraf/telegraf) to work together with the [Shared Coordinator](repo here) web app.

## Prerequisites

- Node.js installed
- npm (Node Package Manager) installed
- TypeScript installed

## Setup Instructions

### 1. Set Up Telegram Bot in Telegram
Follow the instructions in this [Telegram Bot Tutorial](https://core.telegram.org/bots/tutorial) to set up your Telegram bot.


### 2. Get Token and Paste in .env
After setting up your bot, get the token and create a `.env` file in your project directory. Add your token to the `.env` file as shown below:

### 3. Install Dependencies
Run the following commands to install the necessary dependencies:

```sh
npm install
npx tsc
node src/bot.js
```

Note: Ran on node v21.7.1
