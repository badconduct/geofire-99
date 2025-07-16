require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = require('./lib/storage.js');
const newsService = require('./lib/news_service.js');
const pluginService = require('./lib/plugin_service.js');
const aiService = require('./lib/ai_service.js');

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

const LOG_PREFIX = "[GeoFire '99]";

// A list of valid neighborhood codes to prevent routing conflicts.
const NEIGHBORHOOD_CODES = [
  'area51',
  'hollywood',
  'sunsetstrip',
  'heartland',
  'wallstreet',
  'siliconvalley',
  'tokyo',
  'soho',
  'rainforest',
  'capitolhill',
  'motorcity',
  'yosemite'
];

// --- Middleware ---
// IE6 Compatibility Note: CORS is not supported by IE6's XMLHttpRequest.
// This is fine as long as all frontend AJAX calls are same-origin (e.g., from the same host/port).
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Serve static files from root
app.use('/assets', express.static(path.join(__dirname, 'assets'))); // Serve assets

// --- Multer Setup for File Uploads ---
const upload = multer({
  dest: 'uploads/', // Temp storage for uploads
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    // This filter is now updated to include .swf for Flash files.
    const allowedTypes = /jpeg|jpg|gif|mid|midi|swf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype || extname) {
      // Use OR to allow various mimetypes which might not match extension
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports GIF, JPG, JPEG, MID, and SWF.'));
  }
});

// --- File System Setup ---
console.log(`${LOG_PREFIX} User sites directory is ready at ${path.join(__dirname, 'user_sites')}`);
storage.init(); // Create sample sites if they don't exist
newsService.warmup(); // Pre-fetch news on startup

// --- API Endpoints ---

// GET news from 1999
app.get('/api/news', async (req, res) => {
  const news = await newsService.getNews();
  if (news && news.length > 0) {
    res.json(news);
  } else {
    res.status(500).json({
      success: false,
      message: 'Could not retrieve news at this time.'
    });
  }
});

// GET all sites metadata for portal page
app.get('/api/sites', (req, res) => {
  const allSites = storage.getAllSites();
  res.json(allSites);
});

// POST register a new site
app.post('/api/register', (req, res) => {
  const { username, neighborhoodCode, password } = req.body;
  const result = storage.registerSite(username, neighborhoodCode, password);
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.status || 400).json({ success: false, message: result.message });
  }
});

// POST login
app.post('/api/login', (req, res) => {
  const { username, password, passwordHash } = req.body;
  const result = storage.login(username, password, passwordHash);
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.status || 400).json({ success: false, message: result.message });
  }
});

// POST update a file
app.post('/api/file', (req, res) => {
  const { username, passwordHash, neighborhoodCode, filePath, content } = req.body;
  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  const result = storage.updateFile(username, neighborhoodCode, filePath, content);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(result.status || 500).json({ success: false, message: result.message });
  }
});

// POST create a new file
app.post('/api/file/create', (req, res) => {
  const { username, passwordHash, neighborhoodCode, currentPath, fileName } = req.body;
  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  const result = storage.createFile(username, neighborhoodCode, currentPath, fileName);
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.status || 500).json(result);
  }
});

// POST delete a file or folder
app.post('/api/file/delete', (req, res) => {
  const { username, passwordHash, neighborhoodCode, targetPath } = req.body;
  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  const result = storage.deletePath(username, neighborhoodCode, targetPath);
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.status || 500).json(result);
  }
});

// GET download a file
app.get('/api/file/download', (req, res) => {
  const { username, neighborhoodCode, filePath } = req.query;
  const result = storage.getSecureFilePath(username, neighborhoodCode, filePath);
  if (result.success) {
    res.download(result.fullPath);
  } else {
    res.status(result.status || 500).send(result.message);
  }
});

// POST upload a file (image, midi, or swf)
app.post(
  '/api/file/upload',
  upload.single('file'),
  (req, res, next) => {
    // This is wrapped to provide a better JSON error response
    const { username, passwordHash, neighborhoodCode } = req.body;
    const auth = storage.authenticateByHash(username, passwordHash);
    if (!auth.success) {
      // Clean up temp file on auth error
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(auth.status).json(auth);
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded.' });
    }

    const tempPath = req.file.path;
    const originalName = req.file.originalname;

    const result = storage.saveUploadedFile(username, neighborhoodCode, tempPath, originalName);

    // Clean up temp file regardless of outcome
    fs.unlink(tempPath, err => {
      if (err) console.error(`${LOG_PREFIX} Error cleaning up temp file ${tempPath}:`, err);
    });

    // --- IE6 Compatibility Fix ---
    // For iframe-based file uploads, the response must be text/html.
    // Wrapping the JSON in a <textarea> is a robust way to prevent the browser
    // from misinterpreting the JSON and allows the client-side JS to easily extract it.
    res.setHeader('Content-Type', 'text/html');
    if (result.success) {
      res.send(`<html><body><textarea>${JSON.stringify(result)}</textarea></body></html>`);
    } else {
      res
        .status(result.status || 500)
        .send(`<html><body><textarea>${JSON.stringify(result)}</textarea></body></html>`);
    }
  },
  (error, req, res, next) => {
    // This handles errors from the multer filter specifically.
    // --- IE6 Compatibility Fix ---
    // Apply the same textarea-wrapping strategy for error responses.
    res.setHeader('Content-Type', 'text/html');
    res.status(400).send(
      `<html><body><textarea>${JSON.stringify({
        success: false,
        message: error.message
      })}</textarea></body></html>`
    );
  }
);

// POST create a directory
app.post('/api/directory/create', (req, res) => {
  const { username, passwordHash, neighborhoodCode, newDirectoryPath } = req.body;
  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  const result = storage.createDirectory(username, neighborhoodCode, newDirectoryPath);
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.status || 500).json(result);
  }
});

// --- Plugin Endpoints ---

// POST get available plugins and their dynamic options for a user
app.post('/api/plugins', (req, res) => {
  const { username, passwordHash, neighborhoodCode } = req.body;

  // Harden the endpoint with strict validation BEFORE calling the service.
  if (
    !username ||
    typeof username !== 'string' ||
    !passwordHash ||
    typeof passwordHash !== 'string' ||
    !neighborhoodCode ||
    typeof neighborhoodCode !== 'string'
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid or missing user credentials.' });
  }

  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  const plugins = pluginService.getPluginOptionsForUser(username, neighborhoodCode);
  res.json(plugins);
});

// POST update user's active plugins
app.post('/api/plugins/update', (req, res) => {
  const { username, passwordHash, neighborhoodCode, activePlugins } = req.body;

  // Harden the endpoint with strict validation BEFORE calling the service.
  if (
    !username ||
    typeof username !== 'string' ||
    !passwordHash ||
    typeof passwordHash !== 'string' ||
    !neighborhoodCode ||
    typeof neighborhoodCode !== 'string' ||
    !Array.isArray(activePlugins)
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid or missing parameters for plugin update.' });
  }

  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  const result = pluginService.updateUserPlugins(username, neighborhoodCode, activePlugins);
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.status || 500).json(result);
  }
});

// GET hit counter image for a specific site
app.get('/api/plugins/hitcounter', (req, res) => {
  const { site } = req.query;
  if (!site) {
    return res.status(400).send('Site parameter is required.');
  }
  // Get the page that is requesting the counter to make it page-specific.
  const referer = req.headers.referer;

  // Logic is now in the plugin module
  try {
    const hitCounterModule = require('./plugins/hitcounter.js');
    hitCounterModule.getImage(site, referer, res);
  } catch (e) {
    console.error(`${LOG_PREFIX} Error loading hitcounter module:`, e);
    res.status(500).send('Server error loading plugin.');
  }
});

// POST to reset hit counter for a specific site
app.post('/api/plugins/hitcounter/reset', (req, res) => {
  const { username, passwordHash, neighborhoodCode } = req.body;
  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  try {
    const hitCounterModule = require('./plugins/hitcounter.js');
    const result = hitCounterModule.resetCounter(username, neighborhoodCode);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} Error loading hitcounter module for reset:`, e);
    res.status(500).json({ success: false, message: 'Server error loading plugin.' });
  }
});

// --- Guestbook Plugin Endpoints ---
app.post('/api/plugins/guestbook/add', (req, res) => {
  const { site, name, message } = req.body;
  if (!site || !name || !message) {
    return res.status(400).send('Missing required fields.');
  }

  try {
    const guestbookModule = require('./plugins/guestbook.js');
    const result = guestbookModule.addEntry(site, { name, message });
    if (result.success) {
      // Redirect back to the new guestbook.html page after posting
      res.redirect(result.redirectUrl);
    } else {
      res.status(500).send(result.message || 'Failed to add guestbook entry.');
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} Error loading guestbook module:`, e);
    res.status(500).send('Server error loading plugin.');
  }
});

// GET a random webring neighbor
app.get('/api/plugins/webring/random', (req, res) => {
  const { currentUser, neighborhoodCode } = req.query;
  console.log(
    `${LOG_PREFIX} WebRing - Request for random neighbor for ${currentUser} in ${neighborhoodCode}`
  );

  if (!currentUser || !neighborhoodCode) {
    return res.status(400).send('Missing required parameters.');
  }

  try {
    const webringModule = require('./plugins/webring.js');
    const randomNeighbor = webringModule.getRandomNeighbor(currentUser, neighborhoodCode);

    if (randomNeighbor) {
      const redirectUrl = `/${neighborhoodCode}/${randomNeighbor}/`;
      console.log(`${LOG_PREFIX} WebRing - Redirecting to ${redirectUrl}`);
      res.redirect(302, redirectUrl); // 302 for temporary redirect
    } else {
      // If no other user, redirect back to self.
      const selfUrl = `/${neighborhoodCode}/${currentUser}/`;
      console.log(
        `${LOG_PREFIX} WebRing - No other neighbor found, redirecting to self at ${selfUrl}`
      );
      res.redirect(302, selfUrl);
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} Error loading webring module:`, e);
    res.status(500).send('Server error loading plugin.');
  }
});

// --- Gemini Endpoint (Refactored to use aiService) ---
app.post('/api/gemini', async (req, res) => {
  const { userPrompt, chatHistory, fileTree, username, passwordHash, neighborhoodCode } = req.body;
  console.log(`${LOG_PREFIX} POST /api/gemini - Received prompt: "${userPrompt}"`);

  // 1. Authenticate User
  const auth = storage.authenticateByHash(username, passwordHash);
  if (!auth.success) return res.status(auth.status).json(auth);

  // 2. Delegate to the AI Service
  try {
    const aiResponse = await aiService.getAiResponse({
      userPrompt,
      chatHistory,
      fileTree,
      username,
      neighborhoodCode
    });
    res.json({ success: true, content: aiResponse });
  } catch (error) {
    // The service layer will have already logged the detailed error.
    // We just need to send a user-friendly response.
    res.status(500).json({
      success: false,
      message: `An error occurred while communicating with the AI assistant: ${error.message}`
    });
  }
});

// --- Public Site Serving ---
// This definitive route handler serves user-created sites.
app.get('/:neighborhoodCode/:username*', (req, res, next) => {
  const { neighborhoodCode } = req.params;

  // Guard clause to prevent this route from catching static asset paths.
  if (!NEIGHBORHOOD_CODES.includes(neighborhoodCode)) {
    return next();
  }

  const fullUserPath = req.params.username + (req.params[0] || '');
  console.log(`${LOG_PREFIX} User Route: Request for /${neighborhoodCode}/${fullUserPath}`);

  // Extract username and the relative path within the user's site
  const pathParts = fullUserPath.split('/').filter(p => p.length > 0);
  const username = pathParts.shift();
  const relativePath = pathParts.join('/');
  console.log(
    `${LOG_PREFIX} User Route: Parsed username='${username}', relativePath='${relativePath}'`
  );

  if (!username) {
    // This can happen if the path is just /neighborhood/. Let the main router handle it.
    console.log(`${LOG_PREFIX} User Route: No username found, passing to next handler.`);
    return next();
  }

  const result = storage.getSecureFilePath(username, neighborhoodCode, relativePath);

  if (result.success) {
    const filePath = result.fullPath;
    console.log(`${LOG_PREFIX} User Route: Secured path is ${filePath}`);
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          console.log(`${LOG_PREFIX} User Route: Path is a file. Serving.`);

          const ext = path.extname(filePath).toLowerCase();
          const textBasedExtensions = ['.html', '.htm', '.css', '.js', '.txt'];

          if (textBasedExtensions.includes(ext)) {
            // For text files, read and send with UTF-8 encoding.
            if (ext === '.html' || ext === '.htm') {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
            }
            return res.send(fs.readFileSync(filePath, 'utf-8'));
          } else {
            // For binary files (images, sounds, etc.), use res.sendFile.
            // This correctly streams the data and sets the Content-Type header.
            return res.sendFile(filePath);
          }
        }
        if (stats.isDirectory()) {
          // If a directory is requested without a trailing slash, redirect to add it.
          // This is crucial for correct relative path resolution in the browser.
          if (!req.path.endsWith('/')) {
            console.log(
              `${LOG_PREFIX} User Route: Redirecting to add trailing slash for directory.`
            );
            return res.redirect(301, req.path + '/');
          }
          console.log(`${LOG_PREFIX} User Route: Path is a directory. Checking for index.html.`);
          const indexFile = path.join(filePath, 'index.html');
          if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
            console.log(`${LOG_PREFIX} User Route: Found index.html. Serving.`);
            // IE6 Compatibility: Explicitly set charset to match meta tag in HTML files
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(fs.readFileSync(indexFile, 'utf-8'));
          }
        }
      }
      // If we get here, the path was valid but the file doesn't exist,
      // or it was a directory without an index.html. Send a 404.
      console.log(`${LOG_PREFIX} User Route: File not found at path. Sending 404.`);
      return res
        .status(404)
        .send(
          '<html><body><h1>404 Not Found</h1><p>The requested page was not found on this GeoFire site.</p></body></html>'
        );
    } catch (e) {
      console.error(`${LOG_PREFIX} Error accessing user file path: ${filePath}`, e);
      return res.status(500).send('Server error');
    }
  } else {
    // Path was not secure OR user wasn't found in this neighborhood.
    // Check for a redirect first for usability.
    const userLocation = storage.findUser(username);
    if (userLocation && userLocation.neighborhoodCode !== neighborhoodCode) {
      const correctUrl = `/${userLocation.neighborhoodCode}/${username}${
        relativePath ? '/' + relativePath : ''
      }`;
      console.log(
        `${LOG_PREFIX} User '${username}' found in wrong neighborhood. Redirecting from '${neighborhoodCode}' to '${userLocation.neighborhoodCode}'.`
      );
      return res.redirect(301, correctUrl);
    }
    // If no redirect, then it's a 404.
    console.log(
      `${LOG_PREFIX} User Route: Secure path check failed and no redirect possible. Sending 404.`
    );
    return res
      .status(404)
      .send(
        '<html><body><h1>404 Not Found</h1><p>User or neighborhood not found.</p></body></html>'
      );
  }
});

// --- Final Route Handling ---
// Route for the dedicated builder page
app.get('/builder.html', (req, res) => {
  // IE6 Compatibility: Explicitly set charset to prevent rendering issues.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'builder.html'));
});

// Route for client-side routing. All other GET requests serve the main app.
app.get('*', (req, res) => {
  // IE6 Compatibility: Explicitly set charset to prevent rendering issues.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Server Start ---
app.listen(port, host, () => {
  console.log(`${LOG_PREFIX} Server listening on http://${host}:${port}`);
});
