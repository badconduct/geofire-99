const fs = require('fs');
const path = require('path');
const storage = require('./storage.js');
const PluginRegistry = require('../plugins/registry.js');
const inject = require('./html_injector.js'); // Use direct require

const LOG_PREFIX = "[GeoFire '99 Plugins]";

/**
 * Escapes characters with special meaning in regular expressions.
 * @param {string} string The string to escape.
 * @returns {string} The escaped string, safe to use in a RegExp.
 */
function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Service Functions ---
const pluginService = {};

pluginService.getPluginOptionsForUser = function (username, neighborhoodCode) {
  console.log(`${LOG_PREFIX} Getting plugin options for user: ${username} in ${neighborhoodCode}`);
  const pluginsForUI = [];

  // Iterate over the central registry.
  for (const pluginId in PluginRegistry) {
    if (!Object.prototype.hasOwnProperty.call(PluginRegistry, pluginId)) continue;

    const pluginDef = PluginRegistry[pluginId];
    const uiPlugin = {
      id: pluginId,
      name: pluginDef.name,
      description: pluginDef.description,
      options: {}
    };

    if (pluginDef.hasDynamicOptions) {
      try {
        const pluginModule = require('../plugins/' + pluginDef.module);
        if (pluginModule && typeof pluginModule.getDynamicOptions === 'function') {
          // Merge dynamic options into the plugin definition's static options
          const dynamicOptions = pluginModule.getDynamicOptions(username, neighborhoodCode);
          for (const key in dynamicOptions) {
            if (!uiPlugin.options[key]) uiPlugin.options[key] = {};
            uiPlugin.options[key].label = dynamicOptions[key].label;
            uiPlugin.options[key].choices = dynamicOptions[key].choices;
          }
        }
      } catch (e) {
        console.error(`${LOG_PREFIX} Error loading module for dynamic options for ${pluginId}:`, e);
      }
    }

    // Add static options
    if (pluginDef.options) {
      for (const key in pluginDef.options) {
        if (!uiPlugin.options[key]) uiPlugin.options[key] = {};
        if (!uiPlugin.options[key].label) {
          uiPlugin.options[key].label = pluginDef.options[key].label;
        }
        if (!uiPlugin.options[key].choices) {
          uiPlugin.options[key].choices = pluginDef.options[key].choices || [];
        }
      }
    }

    pluginsForUI.push(uiPlugin);
  }

  return pluginsForUI;
};

pluginService.updateUserPlugins = function (username, neighborhoodCode, requestedPlugins) {
  console.log(`${LOG_PREFIX} ----- Begin Plugin Update for ${username} -----`);

  const metaPathResult = storage.getSecureFilePath(username, neighborhoodCode, 'meta.json');
  if (!metaPathResult.success) {
    return { success: false, status: 500, message: 'Could not locate user metadata.' };
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaPathResult.fullPath, 'utf-8'));
    const currentPluginConfigs = meta.plugins || [];

    const indexPathResult = storage.getSecureFilePath(username, neighborhoodCode, 'index.html');
    if (!indexPathResult.success) {
      return { success: false, status: 500, message: 'Could not locate index.html' };
    }

    let indexContent = fs.readFileSync(indexPathResult.fullPath, 'utf-8');

    // --- New, More Robust Update Logic ---

    // 1. Remove ALL managed plugin snippets from the file first.
    // This prevents duplicates and handles option changes correctly.
    console.log(`${LOG_PREFIX} Removing all existing plugin snippets...`);
    for (const pluginId in PluginRegistry) {
      if (!Object.prototype.hasOwnProperty.call(PluginRegistry, pluginId)) continue;

      const pluginDef = PluginRegistry[pluginId];
      const namesToRemove = [pluginDef.name];
      if (pluginDef.legacyNames && pluginDef.legacyNames.length > 0) {
        for (var i = 0; i < pluginDef.legacyNames.length; i++) {
          namesToRemove.push(pluginDef.legacyNames[i]);
        }
      }

      for (var j = 0; j < namesToRemove.length; j++) {
        var name = namesToRemove[j];
        try {
          const safePluginName = escapeRegExp(name);
          const removalRegex = new RegExp(
            `<!-- ${safePluginName} Plugin -->[\\s\\S]*?<!-- /${safePluginName} Plugin -->`,
            'gi'
          );
          indexContent = indexContent.replace(removalRegex, '');
        } catch (e) {
          console.error(`${LOG_PREFIX} Error during snippet removal for plugin '${name}':`, e);
        }
      }
    }

    // 2. Call onUninstall for any plugins that are being fully removed.
    const requestedPluginIds = requestedPlugins.map(p => p.id);
    const pluginsToRemove = currentPluginConfigs.filter(p => !requestedPluginIds.includes(p.id));
    for (const pluginConfig of pluginsToRemove) {
      try {
        const pluginModule = require('../plugins/' + PluginRegistry[pluginConfig.id].module);
        if (typeof pluginModule.onUninstall === 'function') {
          console.log(`${LOG_PREFIX} Calling onUninstall for ${pluginConfig.id}`);
          pluginModule.onUninstall(username, neighborhoodCode);
        }
      } catch (e) {
        console.error(`${LOG_PREFIX} Error during onUninstall for ${pluginConfig.id}:`, e);
      }
    }

    // 3. Now, add all requested snippets back to the clean file.
    console.log(`${LOG_PREFIX} Adding active plugin snippets...`);
    for (const pluginConfig of requestedPlugins) {
      try {
        const pluginModule = require('../plugins/' + PluginRegistry[pluginConfig.id].module);
        const snippet = pluginModule.getSnippet(username, neighborhoodCode, pluginConfig.options);

        // Use the new injector module to handle adding the snippet.
        indexContent = inject(indexContent, snippet);

        // Call onInstall hook if the plugin was not previously active
        const wasPreviouslyActive = currentPluginConfigs.find(p => p.id === pluginConfig.id);
        if (!wasPreviouslyActive && typeof pluginModule.onInstall === 'function') {
          console.log(`${LOG_PREFIX} Calling onInstall for new plugin ${pluginConfig.id}`);
          pluginModule.onInstall(username, neighborhoodCode, pluginConfig.options);
        }
      } catch (e) {
        console.error(`${LOG_PREFIX} Error during snippet addition for ${pluginConfig.id}:`, e);
      }
    }

    fs.writeFileSync(indexPathResult.fullPath, indexContent.trim());
    meta.plugins = requestedPlugins;
    fs.writeFileSync(metaPathResult.fullPath, JSON.stringify(meta, null, 2));

    console.log(`${LOG_PREFIX} ----- End Plugin Update for ${username} -----`);
    return { success: true, message: 'Plugins updated successfully.' };
  } catch (error) {
    console.error(`${LOG_PREFIX} CRITICAL ERROR during plugin update for ${username}:`, error);
    return {
      success: false,
      status: 500,
      message: 'Failed to update plugins due to a server error.'
    };
  }
};

module.exports = pluginService;
