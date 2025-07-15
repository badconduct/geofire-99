const fs = require('fs');
const path = require('path');

const LOG_PREFIX = "[GeoFire '99]";
const SITES_DIR = path.join(__dirname, '..', 'user_sites');
const MAX_FILES_PER_SITE = 25;
const MAX_FILE_TREE_DEPTH = 10; // Security Hardening: Prevent DoS via stack overflow

// Ensure base directory exists
if (!fs.existsSync(SITES_DIR)) {
  fs.mkdirSync(SITES_DIR, { recursive: true });
}

// ---
// SECURITY WARNING: This is a simple, non-cryptographic hash function.
// It is intended ONLY for this simulator to emulate 90s-era security.
// DO NOT USE THIS FOR A REAL-WORLD APPLICATION.
// It provides no protection against modern password cracking techniques.
// ---
function simpleHash(str) {
  let hash = 0;
  if (!str || str.length === 0) {
    return hash.toString();
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

// --- Security Helper ---
// Prevents path traversal attacks by ensuring the resolved path is within the user's directory.
function _securePath(username, neighborhoodCode, userPath) {
  const userDir = path.resolve(SITES_DIR, neighborhoodCode, username);
  const targetPath = path.resolve(userDir, userPath || '');
  if (!targetPath.startsWith(userDir)) {
    return {
      success: false,
      message: 'Access denied: Path is outside of user directory.'
    };
  }
  return { success: true, path: targetPath };
}

// --- File Count Helper ---
function countFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'meta.json') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

const storage = {};

storage.init = function () {
  // The sample site cleanup code is no longer needed and has been removed.
  // This function is kept for potential future initialization tasks.
  console.log(`${LOG_PREFIX} Storage initialized.`);
};

storage.getAllSites = function () {
  console.log(`${LOG_PREFIX} API - Fetching all site metadata.`);
  const allSites = [];
  const neighborhoodDirs = fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const hood of neighborhoodDirs) {
    const userDirs = fs.readdirSync(path.join(SITES_DIR, hood));
    for (const user of userDirs) {
      const metaPath = path.join(SITES_DIR, hood, user, 'meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          allSites.push({
            username: meta.username,
            neighborhoodCode: meta.neighborhoodCode,
            createdAt: meta.createdAt || 0
          });
        } catch (e) {
          console.error(`${LOG_PREFIX} Error parsing meta.json for ${user}`);
        }
      }
    }
  }
  return allSites;
};

storage.readFileTree = function (dir, userPath) {
  const result = [];
  const currentDir = path.join(dir, userPath);
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    if (file === 'meta.json') continue;
    const filePath = path.join(currentDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      result.push({ name: file, type: 'directory' });
    } else {
      result.push({ name: file, type: 'file' });
    }
  }
  return result;
};

storage.readFullFileTree = function (dir, currentDepth) {
  // Security Hardening: Prevent DoS via stack overflow on deeply nested directories.
  currentDepth = currentDepth || 0;
  if (currentDepth > MAX_FILE_TREE_DEPTH) {
    console.error(
      `${LOG_PREFIX} Max directory depth reached at '${dir}'. Aborting file tree read.`
    );
    return [];
  }

  const result = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'meta.json') continue;
    const filePath = path.join(dir, file);
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        result.push({
          name: file,
          type: 'directory',
          children: this.readFullFileTree(filePath, currentDepth + 1)
        });
      } else {
        const binaryExtensions = ['.gif', '.jpg', '.jpeg', '.png', '.ico', '.zip', '.mid', '.midi'];
        const ext = path.extname(file).toLowerCase();

        const fileNode = { name: file, type: 'file' };

        if (binaryExtensions.indexOf(ext) === -1) {
          // Only read content for non-binary files.
          fileNode.content = fs.readFileSync(filePath, 'utf-8');
        }

        result.push(fileNode);
      }
    } catch (e) {
      console.error(
        `${LOG_PREFIX} Error reading file/dir '${filePath}'. Skipping. Error:`,
        e.message
      );
      // Continue the loop, skipping the problematic file.
    }
  }
  return result;
};

storage.registerSite = function (username, neighborhoodCode, password) {
  console.log(`${LOG_PREFIX} API - Attempting to register user: ${username}`);
  const userDir = path.join(SITES_DIR, neighborhoodCode, username);

  if (fs.existsSync(userDir)) {
    console.log(`${LOG_PREFIX} Registration failed for ${username}: Already exists.`);
    return {
      success: false,
      status: 400,
      message: 'This username is already taken.'
    };
  }

  fs.mkdirSync(userDir, { recursive: true });
  fs.mkdirSync(path.join(userDir, 'images'), { recursive: true });
  fs.mkdirSync(path.join(userDir, 'sounds'), { recursive: true });

  const defaultHtml = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><html><head><title>Welcome to ${username}'s new page!</title></head><body bgcolor="#FFFFFF"><center><h1>Welcome to my GeoFire '99 Page!</h1><p>This is ${username}'s new home on the web.</p><img src="images/construct.gif" alt="Under Construction"></center></body></html>`;
  const defaultCss = `body { font-family: "Arial", "Helvetica", sans-serif; color: #000000; } h1 { font-family: "Comic Sans MS", "Impact", fantasy; color: #0000FF; }`;

  // IE6 Compatibility Reminder: Explicitly save files as utf8 without BOM.
  fs.writeFileSync(path.join(userDir, 'index.html'), defaultHtml, 'utf8');
  fs.writeFileSync(path.join(userDir, 'style.css'), defaultCss, 'utf8');

  const passwordHash = simpleHash(password);
  const createdAt = Date.now();

  const meta = {
    username,
    passwordHash,
    neighborhoodCode,
    createdAt,
    plugins: []
  };
  fs.writeFileSync(path.join(userDir, 'meta.json'), JSON.stringify(meta), 'utf8');

  const siteData = {
    username,
    passwordHash,
    neighborhoodCode,
    createdAt,
    plugins: [],
    files: {
      name: 'root',
      type: 'directory',
      children: this.readFullFileTree(userDir, 0)
    }
  };

  console.log(`${LOG_PREFIX} Registration successful for ${username}.`);
  return { success: true, siteData };
};

storage.findUser = function (username) {
  const neighborhoodDirs = fs
    .readdirSync(SITES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const hood of neighborhoodDirs) {
    const userDirPath = path.join(SITES_DIR, hood, username);
    if (fs.existsSync(userDirPath)) {
      return { username, neighborhoodCode: hood, userDir: userDirPath };
    }
  }
  return null; // User not found
};

storage.authenticateByHash = function (username, passwordHash) {
  const userLocation = this.findUser(username);
  if (!userLocation) {
    return { success: false, status: 404, message: 'User not found.' };
  }
  const metaPath = path.join(userLocation.userDir, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return { success: false, status: 500, message: 'User metadata is missing.' };
  }
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (meta.passwordHash !== passwordHash) {
      return { success: false, status: 401, message: 'Authentication failed. Invalid session.' };
    }
    return { success: true, neighborhoodCode: userLocation.neighborhoodCode };
  } catch (e) {
    return { success: false, status: 500, message: 'Could not read user metadata.' };
  }
};

storage.login = function (username, password, passwordHash) {
  console.log(`${LOG_PREFIX} API - Attempting login for user: ${username}`);

  const userLocation = this.findUser(username);

  if (!userLocation) {
    return { success: false, status: 404, message: 'Username not found.' };
  }

  const metaPath = path.join(userLocation.userDir, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return {
      success: false,
      status: 500,
      message: 'User metadata is missing.'
    };
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  var isAuth = false;
  if (password !== undefined) {
    // Standard login with plaintext password
    isAuth = meta.passwordHash === simpleHash(password);
  } else if (passwordHash !== undefined) {
    // Re-authentication using the already-known hash
    isAuth = meta.passwordHash === passwordHash;
  } else {
    return { success: false, status: 400, message: 'Password not provided.' };
  }

  if (!isAuth) {
    return {
      success: false,
      status: 401,
      message: 'Incorrect password or invalid session.'
    };
  }

  // --- Seamless Migration for Older Accounts ---
  // This ensures that essential directories exist for any user who logs in.
  const imagesDir = path.join(userLocation.userDir, 'images');
  const soundsDir = path.join(userLocation.userDir, 'sounds');
  if (!fs.existsSync(imagesDir)) {
    console.log(`${LOG_PREFIX} Migrating user '${username}': Creating missing 'images' directory.`);
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  if (!fs.existsSync(soundsDir)) {
    console.log(`${LOG_PREFIX} Migrating user '${username}': Creating missing 'sounds' directory.`);
    fs.mkdirSync(soundsDir, { recursive: true });
  }
  // --- End Migration ---

  const siteData = {
    username,
    passwordHash: meta.passwordHash,
    neighborhoodCode: userLocation.neighborhoodCode,
    plugins: meta.plugins || [],
    files: {
      name: 'root',
      type: 'directory',
      children: this.readFullFileTree(userLocation.userDir, 0)
    }
  };

  console.log(`${LOG_PREFIX} Login successful for ${username}.`);
  return { success: true, siteData };
};

storage.updateFile = function (username, neighborhoodCode, filePath, content) {
  console.log(`${LOG_PREFIX} API - Updating file for ${username}: ${filePath}`);

  const securePathResult = _securePath(username, neighborhoodCode, filePath);
  if (!securePathResult.success) return securePathResult;
  const fullPath = securePathResult.path;

  if (!fs.existsSync(path.dirname(fullPath))) {
    return { success: false, status: 404, message: 'Directory not found' };
  }

  try {
    // IE6 Compatibility Reminder: Explicitly save files as utf8 without BOM.
    fs.writeFileSync(fullPath, content, 'utf8');
    return { success: true };
  } catch (e) {
    console.error(`${LOG_PREFIX} Error writing file ${fullPath}:`, e);
    return { success: false, status: 500, message: 'Failed to write file.' };
  }
};

storage.createFile = function (username, neighborhoodCode, currentPath, fileName) {
  console.log(
    `${LOG_PREFIX} API - Creating file '${fileName}' in '${currentPath}' for ${username}`
  );

  // Security Hardening: Check for traversal characters first.
  if (fileName.includes('/') || fileName.includes('..')) {
    return {
      success: false,
      status: 400,
      message: 'Invalid filename. Slashes are not permitted.'
    };
  }

  // Security Hardening: Allow more file types but ensure they are safe and valid.
  if (!fileName.match(/^[\w\-\.]+\.(html|htm|css|js)$/i)) {
    return {
      success: false,
      status: 400,
      message:
        'Invalid filename. Only letters, numbers, hyphens, and dots are allowed. Must end in .html, .htm, .css, or .js'
    };
  }

  const userDir = path.join(SITES_DIR, neighborhoodCode, username);
  if (countFiles(userDir) >= MAX_FILES_PER_SITE) {
    return {
      success: false,
      status: 400,
      message: 'File limit reached. You cannot create more than ' + MAX_FILES_PER_SITE + ' files.'
    };
  }

  const securePathResult = _securePath(
    username,
    neighborhoodCode,
    path.join(currentPath, fileName)
  );
  if (!securePathResult.success) return securePathResult;
  const fullPath = securePathResult.path;

  if (fs.existsSync(fullPath)) {
    return { success: false, status: 400, message: 'File already exists.' };
  }

  const defaultContent = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><html><head><title>New Page</title></head><body><p>This is a new page.</p></body></html>`;
  try {
    // IE6 Compatibility Reminder: Explicitly save files as utf8 without BOM.
    fs.writeFileSync(fullPath, defaultContent, 'utf8');
    return {
      success: true,
      message: 'File created.',
      newFile: { name: fileName, type: 'file', content: defaultContent }
    };
  } catch (e) {
    return { success: false, status: 500, message: 'Failed to create file.' };
  }
};

storage.deletePath = function (username, neighborhoodCode, targetPath) {
  console.log(`${LOG_PREFIX} API - Deleting path '${targetPath}' for ${username}`);

  const securePathResult = _securePath(username, neighborhoodCode, targetPath);
  if (!securePathResult.success) return securePathResult;
  const fullPath = securePathResult.path;

  if (!fs.existsSync(fullPath)) {
    return {
      success: false,
      status: 404,
      message: 'File or directory not found.'
    };
  }

  const stats = fs.statSync(fullPath);
  try {
    if (stats.isDirectory()) {
      if (fs.readdirSync(fullPath).length > 0) {
        return {
          success: false,
          status: 400,
          message: 'Directory is not empty.'
        };
      }
      fs.rmdirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
    return { success: true, message: 'Path deleted.' };
  } catch (e) {
    return { success: false, status: 500, message: 'Failed to delete path.' };
  }
};

storage.createDirectory = function (username, neighborhoodCode, newDirectoryPath) {
  console.log(`${LOG_PREFIX} API - Creating directory '${newDirectoryPath}' for ${username}`);

  // Security: Sanitize and validate path
  // 1. Must be inside the "images" directory.
  const normalizedPath = path.normalize(newDirectoryPath).replace(/\\/g, '/');
  if (!normalizedPath.startsWith('images/')) {
    return {
      success: false,
      status: 400,
      message: "Folders can only be created inside the 'images' directory."
    };
  }

  // 2. Folder name must be valid.
  const newFolderName = path.basename(normalizedPath);
  if (!newFolderName.match(/^[\w\-]+$/)) {
    return {
      success: false,
      status: 400,
      message: 'Invalid folder name. Only letters, numbers, hyphens, and underscores are allowed.'
    };
  }

  const securePathResult = _securePath(username, neighborhoodCode, newDirectoryPath);
  if (!securePathResult.success) return securePathResult;
  const fullPath = securePathResult.path;

  if (fs.existsSync(fullPath)) {
    return { success: false, status: 400, message: 'Directory already exists.' };
  }

  try {
    fs.mkdirSync(fullPath, { recursive: true });
    return {
      success: true,
      message: 'Directory created successfully.'
    };
  } catch (e) {
    console.error(`${LOG_PREFIX} Error creating directory ${fullPath}:`, e);
    return { success: false, status: 500, message: 'Failed to create directory.' };
  }
};

storage.getSecureFilePath = function (username, neighborhoodCode, filePath) {
  const securePathResult = _securePath(username, neighborhoodCode, filePath);
  if (!securePathResult.success) {
    return { success: false, status: 403, message: securePathResult.message };
  }
  return { success: true, fullPath: securePathResult.path };
};

storage.saveUploadedFile = function (username, neighborhoodCode, tempPath, originalName) {
  console.log(`${LOG_PREFIX} API - Saving uploaded file '${originalName}' for ${username}`);

  const userDir = path.join(SITES_DIR, neighborhoodCode, username);
  if (countFiles(userDir) >= MAX_FILES_PER_SITE) {
    return {
      success: false,
      status: 400,
      message: 'File limit reached. You cannot create more than ' + MAX_FILES_PER_SITE + ' files.'
    };
  }

  // IMPORTANT: We force uploads to only go into the 'images' or 'sounds' directory for security.
  const lowerCaseName = originalName.toLowerCase();
  const destFolder =
    lowerCaseName.endsWith('.mid') || lowerCaseName.endsWith('.midi') ? 'sounds' : 'images';

  const securePathResult = _securePath(
    username,
    neighborhoodCode,
    path.join(destFolder, originalName)
  );
  if (!securePathResult.success) return securePathResult;
  const finalPath = securePathResult.path;

  try {
    fs.renameSync(tempPath, finalPath);
    return { success: true, message: 'File uploaded.' };
  } catch (e) {
    console.error(`${LOG_PREFIX} Error moving uploaded file:`, e);
    return {
      success: false,
      status: 500,
      message: 'Could not save uploaded file.'
    };
  }
};

module.exports = storage;
