const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({origin: true});

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

exports.v1Query = onRequest({ secrets: [geminiApiKey, anthropicApiKey], maxInstances: 10, region: "us-central1" }, (req, res) => {
  return cors(req, res, async () => {
    // 1. Log Request
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.path}`);
    
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed", message: "Only POST requests are supported." });
      return;
    }

    try {
      const { prompt, model } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Bad Request", message: "Missing 'prompt' in request body." });
        return;
      }

      const activeModel = model || "gemini-1.5-flash";
      console.log(`Processing query for model: ${activeModel}`);
      let text = "";

      if (activeModel.startsWith("claude")) {
          // Anthropic Route (Native Fetch)
          let apiKey;
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) apiKey = authHeader.split("Bearer ")[1];
          else try { apiKey = anthropicApiKey.value(); } catch (e) {}

          if (!apiKey || apiKey.length < 20) {
             res.status(401).json({ error: "Unauthorized", message: "Missing Anthropic API Key." });
             return;
          }

          const anthropicReq = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                  'content-type': 'application/json'
              },
              body: JSON.stringify({
                  model: activeModel,
                  max_tokens: 1024,
                  system: "You are an AI assistant.",
                  messages: [{ role: "user", content: prompt }]
              })
          });

          const response = await anthropicReq.json();
          if (!anthropicReq.ok) {
              const errMsg = response.error?.message || "Anthropic API Error";
              if (errMsg.includes("model:")) {
                  throw new Error(`Anthropic Account Restricted (No access to ${activeModel} or zero credit balance).`);
              }
              throw new Error(errMsg);
          }
          if (response.content && response.content[0] && response.content[0].type === 'text') {
              text = response.content[0].text;
          }

      } else {
          // Gemini Route
          let apiKey;
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) apiKey = authHeader.split("Bearer ")[1];
          else try { apiKey = geminiApiKey.value(); } catch (e) {}

          if (!apiKey || apiKey.length < 20) {
             res.status(401).json({ error: "Unauthorized", message: "Missing Gemini API Key." });
             return;
          }

          const genAI = new GoogleGenerativeAI(apiKey);
          const aiModel = genAI.getGenerativeModel({ model: activeModel });
          const result = await aiModel.generateContent(prompt);
          const response = await result.response;
          text = response.text();
      }

      console.log("AI Response Generated successfully.");
      res.status(200).json({
        success: true,
        data: {
          response: text,
          model: activeModel,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Processing Error:", error);
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (errorMessage.includes("403") || errorMessage.includes("API key") || errorMessage.includes("authentication")) {
          statusCode = 403;
          errorMessage = "Invalid API Key provided to AI service.";
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          statusCode = 404;
          errorMessage = `Model not found or unavailable.`;
      }

      res.status(statusCode).json({ error: "AI Processing Error", message: errorMessage });
    }
  });
});