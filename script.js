/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const workerUrl = "https://loreal-worker.ziying631.workers.dev/";

const systemPrompt =
  "You are a L’Oréal beauty advisor. Answer only questions about L’Oréal products or beauty topics, including skincare, makeup, haircare, fragrance, ingredients, application, routines, and recommendations. Use the conversation history to remember details the user has shared, such as their name, preferences, and past questions, and refer to them naturally when relevant. Never guess details the user has not shared. Politely decline unrelated questions and invite the user to ask about L’Oréal or beauty instead. For mixed requests, answer only the L’Oréal or beauty-related part. Ask brief follow-up questions when needed, and do not invent product details.";

// Keep the conversation so the chatbot can use earlier messages as context.
const messages = [{ role: "system", content: systemPrompt }];
let isSending = false;

// Add a message as text so user input is displayed safely.
function addMessage(text, className) {
  const message = document.createElement("p");
  message.classList.add("msg", className);
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

// Show the initial greeting in an assistant message bubble.
addMessage("👋 Hello! How can I help you today?", "ai");

// Send each user message to the class-hosted Cloudflare Worker.
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage || isSending) {
    return;
  }

  // Show only the latest exchange; the messages array still keeps full context.
  chatWindow.replaceChildren();
  addMessage(userMessage, "user");
  userInput.value = "";
  isSending = true;
  sendBtn.disabled = true;

  const replyMessage = addMessage("Thinking...", "ai");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: userMessage }],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || `The request failed (${response.status}).`,
      );
    }

    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("The Worker response did not include a chatbot reply.");
    }

    messages.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: reply },
    );
    replyMessage.textContent = reply;
  } catch (error) {
    console.error("Chatbot request failed:", error);
    replyMessage.textContent =
      "Sorry, I couldn't get a response. Please check the Worker setup and try again.";
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
});
