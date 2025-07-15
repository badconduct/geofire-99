# GeoFire '99 - The Retro AI Web Host Simulator

Welcome to GeoFire '99, a local simulator of 1990s-era web hosting services like GeoCities and Angelfire, but with a unique twist: it features a modern, AI-powered site builder that is specifically designed to be used on, and create content for, retro web browsers.

This project runs as a full-stack application with a Node.js backend and a vanilla JavaScript frontend.

## Features

- **Authentic 90s Vibe:** A user interface that faithfully recreates the look and feel of late 90s web portals.
- **Full User Account System:** Register, log in, and manage your own retro website.
- **AI-Powered Site Builder:** Use the integrated Gemini assistant to generate retro-compatible HTML, CSS, and JavaScript from plain English prompts.
- **File System Backend:** User sites are stored directly on the local file system in the `user_sites/` directory.
- **Live Site Hosting:** The Node.js server hosts the user-created sites, making them accessible via direct URLs (e.g., `http://localhost:3000/area51/my_cool_site`).
- **Site Discovery:** Browse and search all user-created sites within the application.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Getting Started

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
2.  Add the following content to the `.env` file, replacing the placeholder values:

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

    - Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key from Google AI Studio.
    - The `HOST` and `PORT` variables are optional. If you want to access your GeoFire '99 portal from other computers on your local network, you must set `HOST` to `0.0.0.0`.

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

Open your web browser and navigate to the URL shown in the terminal when you started the server.

You can now use the portal to register new sites, log in, browse neighborhoods, and use the AI builder to create your own 90s masterpiece!
