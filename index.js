// No API key here! It's no longer needed in the browser.

// The API_URL is now your *own* backend proxy function
const API_URL = "/api/generate";

// CHAT HISTORY ARRAY (Unchanged)
let chatHistory = [];

// DOM ELEMENTS (Unchanged)
const promptInput = document.querySelector("#promptInput");
const generateBtn = document.querySelector("#generateBtn");
const resetBtn = document.querySelector("#resetBtn");
const chatLog = document.querySelector("#chatLog");

// createMessageElement function (Unchanged)
const createMessageElement = (role, text) => {
  const isUser = role === "user";
  const wrapper = document.createElement("div");
  const roleClass = isUser ? "chat-user self-end" : "chat-ai self-start";
  const roleLabel = isUser ? "You" : "Gemini";
  const textColor = isUser ? "text-gray-800" : "text-gray-700";

  wrapper.className = `max-w-[75%] p-3 ${roleClass} shadow-sm`;
  wrapper.innerHTML = `
    <div class="font-semibold text-sm mb-1 ${
      isUser ? "text-blue-600" : "text-gray-600"
    }">${roleLabel}:</div>
    <p class="${textColor} whitespace-pre-wrap">${text}</p>
  `;
  return wrapper;
};

// renderChatHistory function (Unchanged)
const renderChatHistory = () => {
  chatLog.innerHTML = "";
  if (chatHistory.length === 0) {
    chatLog.innerHTML =
      '<div class="text-center text-gray-400 text-sm italic py-4">Ask Gemini anything...</div>';
    return;
  }
  chatHistory.forEach((message) => {
    if (message.parts && message.parts[0].text) {
      const role = message.role === "user" ? "user" : "model";
      const element = createMessageElement(role, message.parts[0].text);
      chatLog.appendChild(element);
    }
  });
  chatLog.scrollTop = chatLog.scrollHeight;
};

// resetChat function (Unchanged)
const resetChat = () => {
  chatHistory = [];
  renderChatHistory();
  promptInput.value = "";
  console.log("Chat history has been reset.");
};

// generate function (MODIFIED)
const generate = async () => {
  const userPrompt = promptInput.value.trim();
  if (!userPrompt) return;

  generateBtn.disabled = true;
  resetBtn.disabled = true;
  promptInput.disabled = true;

  const userMessage = {
    role: "user",
    parts: [{ text: userPrompt }],
  };
  chatHistory.push(userMessage);

  promptInput.value = "";
  renderChatHistory();

  const loadingIndicator = document.createElement("div");
  loadingIndicator.textContent = "Gemini is generating a response...";
  loadingIndicator.className = "text-center text-blue-500 italic p-2";
  chatLog.appendChild(loadingIndicator);
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    // Send the request to OUR backend proxy, not Google
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Send the chat history
      body: JSON.stringify({
        contents: chatHistory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    loadingIndicator.remove();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const aiResponseText = data.candidates[0].content.parts[0].text;
      const aiMessage = {
        role: "model",
        parts: [{ text: aiResponseText }],
      };
      chatHistory.push(aiMessage);
      renderChatHistory();
    } else {
      const errorMessage = data.error
        ? data.error.message
        : "No response from AI.";
      chatLog.appendChild(
        createMessageElement("model", `Error: ${errorMessage}`)
      );
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  } catch (error) {
    console.error("Fetch Error: ", error);
    loadingIndicator.remove();
    chatLog.appendChild(
      createMessageElement("model", `An error occurred: ${error.message}`)
    );
    chatLog.scrollTop = chatLog.scrollHeight;
  } finally {
    generateBtn.disabled = false;
    resetBtn.disabled = false;
    promptInput.disabled = false;
    promptInput.focus();
  }
};

// Event Listeners (Unchanged)
generateBtn.addEventListener("click", generate);
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    generate();
  }
});
resetBtn.addEventListener("click", resetChat);

window.onload = renderChatHistory;
