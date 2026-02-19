const functions = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors")({origin: true});

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.query = functions.runWith({ secrets: [geminiApiKey] }).https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // 1. Log Request
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.path}`);
    
    // 2. Validate Method
    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method Not Allowed",
        message: "Only POST requests are supported."
      });
      return;
    }

    // 3. Validate API Key
    let apiKey;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
       apiKey = authHeader.split("Bearer ")[1];
    } else {
       // Check for server-side configured secret (Built-in)
       try {
         apiKey = geminiApiKey.value();
       } catch (e) {
         // Secret not set or accessible
       }
    }

    if (!apiKey || apiKey.length < 20) {
       res.status(401).json({
         error: "Unauthorized",
         message: "Missing API Key. Provide 'Authorization: Bearer <KEY>' or configure server-side key."
       });
       return;
    }

    // 4. Process Query with Real AI
    try {
      const { prompt, model } = req.body;
      
      if (!prompt) {
        res.status(400).json({
          error: "Bad Request",
          message: "Missing 'prompt' in request body."
        });
        return;
      }

      console.log(`Processing query for model: ${model || 'gemini-1.5-flash'}`);

      // Initialize Google AI Client
      const genAI = new GoogleGenerativeAI(apiKey);
      const activeModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });

      // Generate Content
      const result = await activeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("AI Response Generated successfully.");

      res.status(200).json({
        success: true,
        data: {
          response: text,
          model: model || "gemini-1.5-flash",
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Processing Error:", error);
      
      // Handle specific API errors
      let errorMessage = error.message;
      let statusCode = 500;
      
      if (errorMessage.includes("403") || errorMessage.includes("API key")) {
          statusCode = 403;
          errorMessage = "Invalid API Key provided to Google AI service.";
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          statusCode = 404;
          errorMessage = `Model '${model}' not found.`;
      }

      res.status(statusCode).json({
        error: " AI Processing Error",
        message: errorMessage
      });
    }
  });
});
