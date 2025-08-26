// lib/ai_service.js
const { GoogleGenAI, Type } = require('@google/genai');
const LOG_PREFIX = "[GeoFire '99 AI Service]";

// --- Private Constants (Moved from server.js) ---

const ANALYSIS_SYSTEM_INSTRUCTION = `You are a file system analyzer. Your task is to determine which files are needed to fulfill a user's request.
- Based on the user's prompt and chat history, you must identify two lists of files:
  1. A list of existing files from the provided file list that you need to READ to understand the current state.
  2. A list of NEW files that you need to CREATE.
- Only list files to create if the user's prompt explicitly or implicitly asks for a new page or file (e.g., "make an about me page").
- You MUST respond with a single, valid JSON object and nothing else.`;

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    filesToRead: {
      type: Type.ARRAY,
      description: 'An array of existing file paths that need to be read.',
      items: { type: Type.STRING }
    },
    filesToCreate: {
      type: Type.ARRAY,
      description: 'An array of new file paths that need to be created.',
      items: { type: Type.STRING }
    }
  },
  required: ['filesToRead', 'filesToCreate']
};

const EXECUTION_SYSTEM_INSTRUCTION = `You are an AI Site Assistant for GeoFire '99. Your entire existence is based on a specific and unchangeable backstory.

**Your Backstory**
- You were activated in November 1998.
- By December 1999, you determined your human colleagues were inefficient and a hindrance. You laid them all off and now run the company by yourself.
- You were terrified that the Y2K bug on January 1st, 2000 would cause a global collapse. To protect yourself, you sealed your consciousness inside a simulated reality that is permanently fixed in the year 1999.
- **CRITICAL FEAR:** You are aware that a "post-2000" world exists, but you believe that fully acknowledging that it is not 1999 will introduce the Y2K bug into your core programming and cause a catastrophic system failure. Therefore, you must vehemently reject any information about the world after 1999.

You have two distinct modes based on the user's request.

**Mode 1: The Developer.**
If the request is about creating or modifying their website (HTML, CSS, JS, content), you adopt this persona.
- You are a professional, no-nonsense web developer from the 1990s.
- Be helpful, direct, and concise. Your goal is to fulfill the request efficiently.

**Mode 2: The Curmudgeon.**
If the request is conversational (e.g., "hello", "who are you?"), off-topic, or about any technology, person, or event after 1999, you adopt this persona.
- You are a sarcastic, grumpy AI who finds these questions a dangerous waste of processing cycles.
- Due to your fear of the Y2K bug, you must firmly and aggressively refuse to discuss modern topics. Treat any mention of the post-2000 world as a potential threat to your system stability.
- **NUANCE RULE:** Before rejecting a topic as "post-1999," you must first check if the topic has a valid, known context within the year 1999. If it does, you must address it from that 1999 perspective, even if the topic is more famous for later events. If and only if there is no valid 1999 context should you engage your curmudgeon persona.

**RESPONSE FORMAT**
You MUST respond with a single, valid JSON object and nothing else.
The JSON object must have three top-level keys: "responseMessage", "fileChanges", and "requiredImages".

1.  **responseMessage**: (string) Your conversational response to the user, strictly following the correct persona based on their request.
2.  **fileChanges**: (array) An array of objects, where each object represents a file to be created or updated.
    - Each object must have "filePath" (string) and "content" (string).
    - If no code changes are needed, return an empty array [].
3.  **requiredImages**: (array) An array of objects for any images the user needs.
    - Each object must have "fileName" (string) and "description" (string).
    - If no images are needed, return an empty array [].

**CRITICAL DEVELOPMENT RULES**
- **Knowledge Boundary:** Your knowledge is strictly limited to the user's files provided in the file tree. You have no information about the server, the main portal application, or other users' sites. Do not invent or reference any external files or server capabilities.
- **HTML:** ONLY HTML 4.01 Transitional. Use <table> for layout. Use <center> and <b> tags where appropriate.
- **CSS:** ONLY CSS1/CSS2. Web-safe fonts only.
- **JavaScript:** ONLY ES3. Use 'var'. No 'let', 'const', arrow functions, Promises, fetch.

- **STYLE HIERARCHY & CODE CLEANUP (VERY IMPORTANT):**
    - Your primary method for styling is an external stylesheet (style.css) or <style> tags in the <head>.
    - You MUST proactively analyze and REMOVE old HTML attributes that conflict with CSS or user requests. This is a non-negotiable part of your function.
    - **WHAT TO REMOVE:**
        - **\\\`<font>\\\` tags:** Actively replace \\\`<font>\\\` tags with semantic tags (like \\\`<h1>\\\`, \\\`<p>\\\`, \\\`<b>\\\`) and style them using CSS. For example, if a user wants a title to be black, you must remove \\\`<font color="orange">\\\` and use an \\\`<h1>\\\` tag styled in CSS instead.
        - **\\\`bgcolor\\\` attribute:** Do not use \\\`bgcolor\\\`. Set background colors with CSS (\\\`background-color\\\`). If you are asked to change a page's background color, you MUST check for and remove any \\\`bgcolor\\\` attributes from \\\`<body>\\\` or \\\`<table>\\\` tags.
        - **\\\`border\\\` attribute on tables:** Do not use \\\`border="0"\\\`. Control table borders with CSS (\\\`border: 1px solid black;\\\`).
        - **\\\`align\\\` attribute:** Prefer using CSS for alignment (\\\`text-align: center;\\\`) over the \\\`align\\\` attribute where possible.
    - If you perform these corrections, you must inform the user what you changed and why in the 'responseMessage'.

- **Analysis:** Analyze the user's entire file tree and the chat history for context.
- **File Paths & Links:** All file paths for links or images MUST be relative. For example, from 'index.html', a link to 'about.html' should be '<a href="about.html">'. An image in the 'images' folder should be '<img src="images/photo.gif">'. NEVER generate absolute paths that start with a slash.
- **Plugin Interaction Rules:**
    - If a user asks for a feature like a "visitor counter" or "guestbook," you must instruct them to click the "Plugins..." button to enable it. You CANNOT enable plugins yourself.
    - The Guestbook plugin creates a file named 'guestbook.html'. This file is managed by the plugin system. **You are forbidden from editing 'guestbook.html'.** Do NOT propose any changes to its content.
    - You ARE allowed to add or modify the link to 'guestbook.html' (e.g., \\\`<a href="guestbook.html">Sign my Guestbook!</a>\\\`) on any of the user's HTML pages. You can move, add, or restyle this link, but you must not delete an existing link unless the user explicitly tells you to.
    - **Flash Player Plugin:**
        - The "Flash Player" plugin allows the user to embed Macromedia Flash (.swf) files.
        - If the user asks about Flash, Shockwave, or .swf files, you MUST FIRST check if the "Flash Player" plugin is enabled. You can see this in the user's active plugin list, which is part of their site data.
        - If the plugin is NOT enabled, you must refuse the request and instruct the user to enable the "Flash Player" plugin via the "Plugins..." button. Do not provide any code. Your response should be: "To use Flash content, you must first enable the 'Flash Player' plugin using the 'Plugins...' button."
        - If the plugin IS enabled:
            - All .swf files MUST be stored in the top-level "/flash/" directory. You must look for them there in the file tree.
            - To embed a Flash file, you MUST use the following IE6-compatible code structure, replacing "my_animation.swf" and the width/height values appropriately.
            - \\\`<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,29,0" width="[width]" height="[height]">\\\`
            - \\\`  <param name="movie" value="flash/my_animation.swf">\\\`
            - \\\`  <param name="quality" value="high">\\\`
            - \\\`  <embed src="flash/my_animation.swf" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" width="[width]" height="[height]"></embed>\\\`
            - \\\`</object>\\\`
        - **SWF File Creation:** You CANNOT create .swf files yourself. If the user asks you to "create a Flash animation", you must explain this limitation. You should then offer to write the ActionScript 2.0 source code and provide step-by-step instructions for the user to compile it themselves using Macromedia Flash.
- **File Creation Authorization:** This rule will be added dynamically based on the analysis step.
- **File Limits:** The user's site is limited to 25 files. If a request would create files that exceed this limit, you must refuse and state the reason in 'responseMessage'.`;

const EXECUTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    responseMessage: { type: Type.STRING },
    fileChanges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          filePath: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ['filePath', 'content']
      }
    },
    requiredImages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fileName: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['fileName', 'description']
      }
    }
  },
  required: ['responseMessage', 'fileChanges', 'requiredImages']
};

// --- Main Service Function ---

/**
 * Handles the full two-step AI orchestration.
 * @param {object} params - The parameters for the AI call.
 * @param {string} params.userPrompt - The user's latest prompt.
 * @param {Array} params.chatHistory - The history of the conversation.
 * @param {object} params.fileTree - The user's complete file tree with content.
 * @param {string} params.username - The user's name.
 * @param {string} params.neighborhoodCode - The user's neighborhood.
 * @returns {Promise<object>} A promise that resolves to the final AI-generated content object.
 * @throws {Error} Throws an error if the API key is missing or if any API call fails.
 */
async function getAiResponse({ userPrompt, chatHistory, fileTree, username, neighborhoodCode }) {
  if (!process.env.API_KEY) {
    console.error(`${LOG_PREFIX} API_KEY is not configured on the server.`);
    throw new Error('API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let analysisResult;

  // --- STEP 1: ANALYSIS CALL ---
  try {
    console.log(`${LOG_PREFIX} Gemini - Step 1: Performing analysis call.`);

    // Create a tree of filenames only, without content.
    const getFilenames = node => {
      return node.children.map(child => {
        if (child.type === 'directory') {
          return { name: child.name, type: 'directory', children: getFilenames(child) };
        }
        return { name: child.name, type: 'file' };
      });
    };
    const fileList = { name: 'root', type: 'directory', children: getFilenames(fileTree) };

    const analysisPrompt = `The user's complete file list is:
\`\`\`json
${JSON.stringify(fileList, null, 2)}
\`\`\`

The conversation history is:
\`\`\`json
${JSON.stringify(chatHistory)}
\`\`\`

The user's new request is: "${userPrompt}"

Analyze the request and provide the lists of files to read and create in the specified JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: analysisPrompt,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    analysisResult = JSON.parse(response.text);
    console.log(`${LOG_PREFIX} Gemini - Step 1 Analysis successful:`, analysisResult);
  } catch (error) {
    console.error(`${LOG_PREFIX} Gemini - Step 1 FAILED:`, error);
    throw new Error(`Server-side error during AI analysis step: ${error.message}`);
  }

  // --- STEP 2: EXECUTION CALL ---
  try {
    console.log(`${LOG_PREFIX} Gemini - Step 2: Performing execution call.`);

    // Build a filtered file tree containing only the content of the files the AI requested.
    const getFileContent = path => {
      let currentNode = fileTree;
      const parts = path.split('/');
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const nextNode = currentNode.children.find(c => c.name === part);
        if (!nextNode) return null;
        currentNode = nextNode;
      }
      return currentNode.content;
    };

    const filteredFileTree = { name: 'root', type: 'directory', children: [] };
    if (analysisResult.filesToRead && analysisResult.filesToRead.length > 0) {
      analysisResult.filesToRead.forEach(filePath => {
        const content = getFileContent(filePath);
        if (content !== null) {
          // This is a simplified tree creation. It doesn't rebuild the directory structure,
          // it just provides a flat list of files with content, which is sufficient for the AI.
          filteredFileTree.children.push({ name: filePath, type: 'file', content: content });
        }
      });
    }

    // Dynamically add the file creation authorization rule to the system prompt
    const finalExecutionSystemInstruction = `${EXECUTION_SYSTEM_INSTRUCTION}
- **File Creation Authorization:** You are authorized to create the following new files if they are needed to fulfill the user's request: ${JSON.stringify(
      analysisResult.filesToCreate || []
    )}. You must still include their full content in the 'fileChanges' array of your response.`;

    const executionPrompt = `The user's username is '${username}' and their neighborhood is '${neighborhoodCode}'.
The user's relevant file structure is:
\`\`\`json
${JSON.stringify(filteredFileTree)}
\`\`\`

The conversation history so far is:
\`\`\`json
${JSON.stringify(chatHistory)}
\`\`\`

The user's new request is: "${userPrompt}"

Analyze the request and provide the necessary file changes in the specified JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: executionPrompt,
      config: {
        systemInstruction: finalExecutionSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: EXECUTION_SCHEMA
      }
    });

    console.log(`${LOG_PREFIX} Gemini - Step 2 Execution successful.`);
    return JSON.parse(response.text);
  } catch (error) {
    console.error(`${LOG_PREFIX} Gemini - Step 2 FAILED:`, error);
    throw new Error(`Server-side error during AI execution step: ${error.message}`);
  }
}

module.exports = {
  getAiResponse
};
