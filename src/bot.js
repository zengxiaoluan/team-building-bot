const express = require("express");
const axios = require("axios");
const schedule = require("node-schedule");
const config = require("../config.js");
const messages = require("./messages.js");

const app = express();
app.use(express.json());

// 存储已处理的消息，避免重复提醒
const processedMessages = new Set();

/**
 * 检查文本是否包含团建关键词
 */
function containsTeamBuildingKeyword(text) {
  return config.KEYWORDS.teamBuilding.some((keyword) =>
    text.toLowerCase().includes(keyword.toLowerCase()),
  );
}

/**
 * 发送消息到企业微信群
 * @param {string} content - 消息内容
 * @param {string} msgtype - 消息类型（text, markdown 等）
 */
async function sendWeChatMessage(content, msgtype = "text") {
  try {
    const payload = {
      msgtype,
    };

    if (msgtype === "markdown") {
      payload.markdown = { content };
    } else {
      payload.text = { content };
    }

    await axios.post(config.WEBHOOK_URL, payload);
    console.log(`✅ 消息已发送: ${content.substring(0, 50)}...`);
  } catch (error) {
    console.error("❌ 发送消息失败:", error.message);
  }
}

/**
 * 处理团建关键词触发
 */
async function handleTeamBuildingTrigger(messageId) {
  // 避免重复处理同一条消息
  if (processedMessages.has(messageId)) {
    return;
  }
  processedMessages.add(messageId);

  console.log("🎯 检测到团建关键词，开始发送提醒...");

  // 立即发送开发票提醒
  await sendWeChatMessage(messages.INVOICE_REMINDER, "markdown");

  // 延时发送合影提醒
  const delayMs = config.REMINDER_DELAY_MS;
  console.log(`⏰ 将在 ${delayMs / 1000 / 60} 分钟后发送合影提醒`);

  setTimeout(() => {
    sendWeChatMessage(messages.PHOTO_REMINDER, "markdown");
  }, delayMs);
}

/**
 * Webhook 接收企业微信消息
 */
app.post("/hook", async (req, res) => {
  try {
    const { text, from_userid } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text content" });
    }

    const messageContent = text.content || "";
    console.log(`📨 接收到消息: ${messageContent} (来自: ${from_userid})`);

    // 检查是否包含团建关键词
    if (containsTeamBuildingKeyword(messageContent)) {
      const messageId = `${from_userid}-${Date.now()}`;
      await handleTeamBuildingTrigger(messageId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ 处理消息出错:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 定时提醒（可选：每周提醒）
 * 如果希望定期发送提醒，可以设置定时任务
 */
function setupScheduledReminders() {
  // 每周五下午 2:00 PM 发送提醒
  schedule.scheduleJob("0 14 * * 5", async () => {
    console.log("🔔 定时提醒触发（每周五）");
    await sendWeChatMessage(messages.COMPLETE_NOTICE, "markdown");
  });

  console.log("✅ 定时提醒已设置（每周五 14:00）");
}

/**
 * 健康检查端点
 */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.status(200).json("d");
});

/**
 * 手动触发提醒（用于测试）
 */
app.post("/test", async (req, res) => {
  console.log("🧪 测试模式：发送提醒");
  await sendWeChatMessage(messages.INVOICE_REMINDER, "markdown");

  setTimeout(() => {
    sendWeChatMessage(messages.PHOTO_REMINDER, "markdown");
  }, 5000); // 测试时延迟5秒
  res.status(200).json({ message: "测试提醒已发送" });
});

/**
 * 启动服务器
 */
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🤖 企业微信团建提醒机器人已启动     ║
║   端口: ${PORT}                            ║
║   webhook: /hook                         ║
║   健康检查: /health                      ║
║   测试: /test                            ║
╚════════════════════════════════════════╝
  `);

  // 设置定时任务
  setupScheduledReminders();
});

module.exports = app;
