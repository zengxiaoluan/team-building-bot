// 配置文件 - 复制为 config.js 并填入实际 webhook
module.exports = {
  // 企业微信群机器人 webhook URL
  // 在企业微信群 → 群设置 → 添加机器人 → 复制 webhook URL
  WEBHOOK_URL: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxx",

  // 提醒延迟时间（毫秒）
  REMINDER_DELAY_MS: 30 * 60 * 1000, // 30分钟后提醒合影
  // 或者使用指定时间：如每天 17:00 提醒
  // REMINDER_TIME: '17:00',

  // 监听端口
  PORT: 3000,

  // 关键词配置
  KEYWORDS: {
    teamBuilding: ["团建", "建团", "team building", "团建活动"],
  },
};
