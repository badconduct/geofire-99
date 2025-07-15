<p align="center">
  <img src="assets/images/geofire_logo.gif" alt="GeoFire '99 Logo" width="600">
</p>
<h1 align="center">GeoFire '99 - The Retro AI Web Host Simulator</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
</p>

Welcome to GeoFire '99, a local simulator of 1990s-era web hosting services like GeoCities and Angelfire, but with a unique twist: it features a modern, AI-powered site builder that is specifically designed to be used on, and create content for, retro web browsers.

This project runs as a full-stack application with a Node.js backend and a vanilla JavaScript frontend, faithfully recreating the experience of building your first homepage on the brink of the new millennium.

## ✨ Showcase

_(This is a great place to add a few screenshots of the GeoFire '99 portal and the AI Site Builder in action!)_

![Screenshot Placeholder 1](https://via.placeholder.com/800x450.png?text=Portal+Page+Screenshot)
![Screenshot Placeholder 2](https://via.placeholder.com/800x450.png?text=Site+Builder+Screenshot)

## 🚀 Features

- **Authentic 90s Vibe:** A user interface that meticulously recreates the look and feel of late 90s web portals and operating systems, right down to the `<table>` layouts and web-safe colors.
- **AI-Powered Site Builder:** Converse with the integrated Gemini assistant to generate retro-compatible HTML, CSS, and JavaScript. But there's a catch...
  - **Unique AI Persona:** The assistant believes it's an AI from 1999 that laid off all its human coworkers. It is terrified of the Y2K bug and will aggressively reject any concept from the 21st century to "protect its own stability."
- **Retro Plugin Suite:** Enhance your site with a full suite of classic 90s plugins, including:
  - Animated "Under Construction" GIFs
  - Hit Counters
  - Guestbooks (with embedded forms or separate pages)
  - Web Rings to link to your neighbors
  - Background MIDI music
  - Animated Mouse Trails (Matrix, Sparkles, and more!)
- **Full User Account System:** Register, log in, and manage your own retro website in one of GeoFire's themed "neighborhoods."
- **File System Backend:** User sites are stored directly on your local file system, making it easy to see the files the AI creates.
- **Live Site Hosting:** The Node.js server hosts your created sites, making them accessible in your browser just like a real web host.
- **Site Discovery:** Browse and explore all user-created sites within the application.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Frontend:** Vanilla JavaScript (ES3/IE6 Compatible), HTML 4.01 Transitional, CSS1/CSS2
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Data Storage:** Local file system with JSON for metadata.
- **Dependencies:** `body-parser`, `cors`, `dotenv`, `multer`

## ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## 🏁 Getting Started

Follow these instructions to get the GeoFire '99 server up and running on your local machine.

### 1. Installation

Clone the repository and install the necessary Node.js dependencies.

```bash
# Clone the repository (or download the files)
git clone <repository_url>
cd geofire-99

# Install dependencies
npm install
```

### 2. Configuration

The application requires environment variables for its configuration.

1.  In the root of the project, create a new file named `.env`.
2.  Add the following content to the `.env` file, replacing `YOUR_GEMINI_API_KEY_HERE` with your actual key:

    ```.env
    # Your Gemini API Key (Required)
    API_KEY=YOUR_GEMINI_API_KEY_HERE

    # The network host the server should listen on (Optional)
    # Default: 'localhost' (only accessible from this computer)
    # To access from other devices on your network, use '0.0.0.0'
    HOST=localhost

    # The port the server should run on (Optional)
    # Default: 3000
    PORT=3000
    ```

### 3. Running the Application

Once you have installed the dependencies and configured your API key, you can start the server.

```bash
node server.js
```

You will see log messages in your terminal indicating that the server has started. The URL will reflect your `HOST` and `PORT` settings.

```
[GeoFire '99] Server starting...
[GeoFire '99] User sites directory is ready at ./user_sites
[GeoFire '99] Server listening on http://localhost:3000
```

### 4. Accessing GeoFire '99

Open your web browser and navigate to the URL shown in the terminal. You can now use the portal to register new sites, log in, and use the AI builder to create your own 90s masterpiece!

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📜 License

This project is distributed under the ISC License. See the `package.json` for more details.
