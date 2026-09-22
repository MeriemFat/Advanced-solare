import Notification from "../models/Notification.js";

class NotificationService {
  constructor() {
    this.clients = new Set();

    // Send keepalive ping every 25 seconds to prevent connection drops
    setInterval(() => {
      this.sendKeepAlive();
    }, 25000);
  }

  addClient(res, userId = null) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    });

    res.flushHeaders?.();

    const client = { res, userId, connectedAt: new Date() };
    this.clients.add(client);

    // Initial connection event
    res.write(
      `data: ${JSON.stringify({
        type: "connected",
        message: "Notifications stream connected",
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    res.on("close", () => {
      this.clients.delete(client);
    });
  }

  sendKeepAlive() {
    for (const client of this.clients) {
      try {
        client.res.write(": keepalive\n\n");
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  broadcast(payload) {
    const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.clients) {
      // If notification is targeted to a specific recipient, deliver only to that user
      if (payload.recipient && client.userId) {
        if (client.userId.toString() !== payload.recipient.toString()) {
          continue;
        }
      }
      try {
        client.res.write(dataStr);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  async createAndBroadcastNotification({
    title,
    message,
    type = "info",
    recipient = null,
    projectId = null,
    projectName = "",
    author = {},
    metadata = {},
  }) {
    try {
      const notification = await Notification.create({
        title,
        message,
        type,
        recipient,
        projectId,
        projectName,
        author: {
          id: author.id || null,
          name: author.name || "User",
          email: author.email || "",
          role: author.role || "",
        },
        metadata,
      });

      // Broadcast to active SSE subscribers (targeted if recipient specified)
      this.broadcast({
        ...notification.toObject(),
        isRead: false,
      });

      return notification;
    } catch (err) {
      console.error("Error creating/broadcasting notification:", err);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
