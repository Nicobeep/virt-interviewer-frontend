const API_URL = "http://localhost:8000";

export async function createSession(userId: string = "default_user") {
  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  return response.json();
}

export async function sendAgentMessage(sessionId: string, message: string) {
  const response = await fetch(`${API_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      new_message: {
        role: "user",
        parts: [{ text: message }]
      }
    }),
  });
  return response.json();
}