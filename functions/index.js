const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Helper to calculate days remaining until expiry date
 * @param {string | number | Date} expireVal
 * @returns {number}
 */
function getDaysUntilExpiration(expireVal) {
  if (!expireVal) return 999;
  
  if (typeof expireVal === 'string' && (expireVal.toLowerCase() === 'lifetime' || expireVal.toLowerCase() === 'staff account')) {
    return 999;
  }

  let expireDate;
  if (expireVal instanceof Timestamp) {
    expireDate = expireVal.toDate();
  } else {
    expireDate = new Date(expireVal);
  }

  if (isNaN(expireDate.getTime())) {
    return 999;
  }

  const now = new Date();
  const diffTime = expireDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Construct HTML Email template for VIP Expiration Alert
 */
function generateVipExpiryEmailHtml(username, daysLeft, expireDateStr, appUrl = 'https://viceintel.app') {
  const isUrgent = daysLeft <= 3;
  const headerColor = isUrgent ? '#f43f5e' : '#f59e0b'; // rose vs amber
  const badgeText = isUrgent ? 'URGENT: VIP EXPIRING SOON' : 'VIP SUBSCRIPTION RENEWAL REMINDER';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VIP Pass Expiration Alert - GTA VI Central</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, ${headerColor}22 0%, #09090b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #27272a; }
        .badge { display: inline-block; background-color: ${headerColor}; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .title { font-size: 24px; font-weight: 900; color: #ffffff; margin: 0 0 8px 0; letter-spacing: -0.5px; }
        .subtitle { font-size: 14px; color: #a1a1aa; margin: 0; }
        .body-content { padding: 32px 24px; line-height: 1.6; color: #d4d4d8; }
        .stats-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
        .stat-label { font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 900; color: ${headerColor}; }
        .btn { display: block; width: 100%; box-sizing: border-box; background-color: #f43f5e; color: #ffffff; text-align: center; text-decoration: none; font-weight: 800; padding: 14px 24px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; font-size: 14px; }
        .footer { padding: 20px 24px; background-color: #09090b; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">${badgeText}</div>
          <h1 class="title">Hey @${username}, Your VIP Access is Expiring!</h1>
          <p class="subtitle">Maintain your ad-free status, high-framerate voice hubs, and custom vehicle builds.</p>
        </div>
        <div class="body-content">
          <p>This is an automated alert from <strong>GTA VI Central Vice City HQ</strong>. Your VIP Pass is scheduled to expire in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> on <strong>${expireDateStr}</strong>.</p>
          
          <div class="stats-box">
            <div>
              <div class="stat-label">VIP Status</div>
              <div class="stat-value">${daysLeft <= 0 ? 'Expired' : 'Nearing Expiry'}</div>
            </div>
            <div>
              <div class="stat-label">Days Remaining</div>
              <div class="stat-value">${Math.max(0, daysLeft)} Days</div>
            </div>
          </div>

          <p>Don't lose your VIP perks:</p>
          <ul>
            <li>✨ 100% Ad-Free Portal Browsing</li>
            <li>🎙️ High-FPS Screen Share & 90 FPS Voice Comms</li>
            <li>⚡ Priority FiveM RP Server Submissions</li>
            <li>🏆 Exclusive Lucia & Jason Animated Profile Avatars</li>
          </ul>

          <a href="${appUrl}/profile" class="btn">Renew VIP Pass Now ($3.99/mo)</a>
        </div>
        <div class="footer">
          GTA VI Central — Vice City Automated VIP Dispatch Engine<br>
          Sent to registered player email for @${username}.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Core execution logic for checking VIP expirations
 */
async function processVipExpirations() {
  const usersSnap = await db.collection("userProfiles").get();
  const nowStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  let scannedCount = 0;
  let alertsDispatched = 0;
  const alertLogs = [];

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    scannedCount++;

    const isVip = data.isVip || data.role === 'VIP' || data.role === 'Admin' || data.role === 'Staff';
    if (!isVip) continue;

    const daysLeft = getDaysUntilExpiration(data.vipExpires);
    
    // Trigger alert if days left is <= 7 and > -2
    if (daysLeft <= 7 && daysLeft >= -1) {
      const lastAlertDate = data.lastVipExpiryAlertSentAt ? data.lastVipExpiryAlertSentAt.split("T")[0] : null;
      
      // Prevent sending multiple alerts on the exact same day
      if (lastAlertDate === nowStr) {
        continue;
      }

      const email = data.email || `${data.username || 'player'}@vicecity.app`;
      const username = data.username || 'ViceCityPlayer';
      const expireStr = data.vipExpires || 'Upcoming Expiry';

      // 1. Write notification document to userNotifications collection
      const notificationRef = db.collection("userNotifications").doc();
      await notificationRef.set({
        userId: userDoc.id,
        username: username,
        type: 'VIP_EXPIRY_ALERT',
        title: `⚠️ VIP Subscription Expiring in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}`,
        message: `Your VIP Pass will expire on ${expireStr}. Renew today to maintain ad-free access and voice channel privileges.`,
        daysRemaining: daysLeft,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      // 2. Write to Firebase "mail" collection for Firebase Trigger Email extension
      await db.collection("mail").add({
        to: [email],
        message: {
          subject: `[GTA VI Central] ⚠️ VIP Subscription Expiring in ${daysLeft} Days (@${username})`,
          html: generateVipExpiryEmailHtml(username, daysLeft, expireStr)
        },
        metadata: {
          userId: userDoc.id,
          username: username,
          alertType: 'VIP_EXPIRY'
        }
      });

      // 3. Update user profile document record
      await userDoc.ref.update({
        lastVipExpiryAlertSentAt: new Date().toISOString(),
        lastVipExpiryAlertDaysLeft: daysLeft
      });

      alertsDispatched++;
      alertLogs.push({
        userId: userDoc.id,
        username: username,
        email: email,
        daysLeft: daysLeft,
        expireDate: expireStr,
        timestamp: new Date().toISOString()
      });
    }
  }

  return {
    scannedCount,
    alertsDispatched,
    alertLogs,
    executedAt: new Date().toISOString()
  };
}

/**
 * 1. Scheduled Cloud Function (runs daily at midnight UTC)
 */
exports.checkVipExpirationsSchedule = onSchedule("0 0 * * *", async (event) => {
  console.log("Starting automated daily VIP expiration check Cloud Function...");
  try {
    const result = await processVipExpirations();
    console.log("VIP Expiration Check Complete:", JSON.stringify(result));
  } catch (err) {
    console.error("Error running checkVipExpirationsSchedule:", err);
  }
});

/**
 * 2. On-Demand HTTPS Endpoint / Callable Function
 */
exports.triggerVipExpiryAlerts = onRequest({ cors: true }, async (req, res) => {
  try {
    const result = await processVipExpirations();
    res.status(200).json({
      success: true,
      message: `Scanned ${result.scannedCount} user profiles and dispatched ${result.alertsDispatched} VIP expiry notifications.`,
      result
    });
  } catch (err) {
    console.error("Error executing triggerVipExpiryAlerts endpoint:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process VIP expiration alerts."
    });
  }
});
