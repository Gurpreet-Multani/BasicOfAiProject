// This is your new, secure backend function with robust JSON parsing.

export default async function handler(req, res) {
  // We only accept POST requests
  if (req.method !== "POST") {
    // Check if the environment has a dedicated JSON parser (like Vercel does)
    if (req.body && req.body.contents) {
      return handleApiCall(req.body.contents, res);
    }
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // --- Robust JSON Parsing for Netlify/Standard Node ---
  let requestBody;
  try {
    requestBody = await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          // Attempt to parse the raw body string
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Invalid JSON in request body"));
        }
      });
      req.on("error", reject);
    });
  } catch (e) {
    return res.status(400).json({ error: "Could not parse request body." });
  }

  await handleApiCall(requestBody.contents, res);
}

// Separate function to handle the core logic
async function handleApiCall(contents, res) {
  if (!contents) {
    return res
      .status(400)
      .json({ error: 'No "contents" (chat history) provided.' });
  }

  // Get the secret API key from the server's environment variables
  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "API key is not configured on the server." });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

  try {
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contents: contents }), // Pass on the chat history
    });

    if (!apiResponse.ok) {
      // Get error details from the upstream API
      const errorData = await apiResponse
        .json()
        .catch(() => ({
          error: { message: `Upstream API error: ${apiResponse.statusText}` },
        }));
      throw new Error(errorData.error.message || "API Error");
    }

    const data = await apiResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
