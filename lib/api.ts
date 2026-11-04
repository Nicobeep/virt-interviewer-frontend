const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://virt-interviewer-backend.onrender.com";

export async function createSession(userId: string = "default_user") {
  const appName = "interviewer_agent"; 
  
  const response = await fetch(`${API_URL}/apps/${appName}/users/${userId}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create session (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function sendAgentMessage(sessionId: string, message: string, userId: string = "default_user") {
  const appName = "interviewer_agent"; 
  
  const response = await fetch(`${API_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: appName,
      userId: userId,
      sessionId: sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: message }]
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message (${response.status}): ${errorText}`);
  }

  return response.json();
}
