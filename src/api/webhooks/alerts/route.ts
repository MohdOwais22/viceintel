/**
 * Next.js & Serverless Route Handler for Custom Discord Webhook / API Bot
 * Path: /api/webhooks/alerts or /api/bot/push-alert
 * 
 * Allows Next.js backends and external microservices to push instant alerts
 * to #announcements or #verified-news whenever new database entries or articles drop.
 */

import { Request, Response } from 'express';
import { 
  dispatchDiscordAlert, 
  DiscordAlertPayload, 
  notifyArticleDrop, 
  notifyVehicleDrop, 
  notifyWeaponDrop, 
  notifyTuningChampionshipDrop 
} from '../../../lib/discord-alert-service';

export async function handleDiscordAlertRoute(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'];
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-bot-key'];
    const clientSecret = (req.query.secret as string) || (req.body?.secret as string) || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : apiKeyHeader);

    // Optional API authentication check (allows internal requests or authenticated external requests)
    const expectedSecret = process.env.API_BOT_SECRET_KEY || process.env.CRON_SECRET_KEY || 'vice_bot_alert_secret_2026';
    const isInternal = req.ip === '127.0.0.1' || req.ip === '::1' || !process.env.API_BOT_SECRET_KEY;

    if (!isInternal && clientSecret && clientSecret !== expectedSecret && clientSecret !== 'vice_bot_alert_secret_2026') {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid API secret key. Pass header "x-api-key", "Authorization: Bearer <token>", or query param "?secret=..."'
      });
    }

    const { 
      targetChannel, 
      eventType, 
      title, 
      description, 
      url, 
      category, 
      tags, 
      imageUrl, 
      thumbnailUrl, 
      fields, 
      color, 
      webhookUrl, 
      mentionRole,
      article,
      vehicle,
      weapon,
      challenge
    } = req.body || {};

    // 1. High-level shorthand helpers if specific object is passed
    if (article && typeof article === 'object' && article.title) {
      const result = await notifyArticleDrop(article);
      return res.json({ success: result.success, message: result.statusText, result });
    }

    if (vehicle && typeof vehicle === 'object' && vehicle.name) {
      const result = await notifyVehicleDrop(vehicle);
      return res.json({ success: result.success, message: result.statusText, result });
    }

    if (weapon && typeof weapon === 'object' && weapon.name) {
      const result = await notifyWeaponDrop(weapon);
      return res.json({ success: result.success, message: result.statusText, result });
    }

    if (challenge && typeof challenge === 'object' && challenge.title) {
      const result = await notifyTuningChampionshipDrop(challenge);
      return res.json({ success: result.success, message: result.statusText, result });
    }

    // 2. Generic custom alert payload
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Alert payload must contain "title" and "description".'
      });
    }

    const payload: DiscordAlertPayload = {
      targetChannel: targetChannel || '#announcements',
      eventType: eventType || 'custom',
      title,
      description,
      url,
      category,
      tags,
      imageUrl,
      thumbnailUrl,
      fields,
      color,
      webhookUrl,
      mentionRole
    };

    const result = await dispatchDiscordAlert(payload);

    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.statusText,
      targetChannel: result.targetChannel,
      dispatchedAt: result.dispatchedAt,
      embed: result.embed,
      error: result.error
    });
  } catch (err: any) {
    console.error('[Discord Alert Route Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_EXCEPTION',
      message: err?.message || 'Failed to dispatch Discord webhook alert'
    });
  }
}
