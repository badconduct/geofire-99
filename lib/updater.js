const fs = require("fs");
const path = require("path");
const storage = require("./storage.js");

const LOG_PREFIX = "[GeoFire '99 Updater]";
const SITES_DIR = path.join(__dirname, "..", "user_sites");

/**
 * Checks for and creates the /sounds directory for a given user site if it doesn't exist.
 * @param {object} site - The site metadata object { username, neighborhoodCode }.
 */
function _addSoundsDirectory(site) {
  const userDir = path.join(SITES_DIR, site.neighborhoodCode, site.username);
  const soundsDir = path.join(userDir, "sounds");

  if (!fs.existsSync(soundsDir)) {
    try {
      fs.mkdirSync(soundsDir);
      console.log(
        `${LOG_PREFIX} Created missing 'sounds' directory for user: ${site.username}`
      );
    } catch (error) {
      console.error(
        `${LOG_PREFIX} Failed to create 'sounds' directory for ${site.username}:`,
        error
      );
    }
  }
}

/**
 * Applies all necessary update tasks to a single user site.
 * This function can be expanded with future migration tasks.
 * @param {object} site - The site metadata object.
 */
function _applyUpdatesToSite(site) {
  // Add new migration functions here in the future.
  _addSoundsDirectory(site);
}

/**
 * Main function to run all updates for all existing user sites.
 * This should be called on server startup.
 */
function runUpdates() {
  console.log(`${LOG_PREFIX} Starting user profile update check...`);
  try {
    const allSites = storage.getAllSites();
    if (allSites.length === 0) {
      console.log(`${LOG_PREFIX} No user sites found to update.`);
      return;
    }

    console.log(
      `${LOG_PREFIX} Checking ${allSites.length} user profiles for necessary updates.`
    );
    for (const site of allSites) {
      _applyUpdatesToSite(site);
    }
    console.log(`${LOG_PREFIX} User profile update check complete.`);
  } catch (error) {
    console.error(
      `${LOG_PREFIX} An error occurred during the update process:`,
      error
    );
  }
}

module.exports = {
  runUpdates,
};
