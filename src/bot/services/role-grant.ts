import { Client, PermissionsBitField, TextChannel, EmbedBuilder } from 'discord.js';

export interface RoleGrantResult {
  success: boolean;
  error?: string;
  hierarchyInvalid?: boolean;
  discordErrorCode?: number | string;
}

/**
 * Hierarchy-safe and permission-guarded role assignment utility.
 * Prevents silent Discord permission failures by validating both bot permissions and role hierarchy,
 * catching Discord API exceptions, and automatically dispatching formatted embeds to the staff log channel.
 */
export async function grantWhitelistRole(
  client: Client,
  guildId: string,
  userId: string,
  roleId: string,
  logsChannelId?: string
): Promise<RoleGrantResult> {
  let guild: any = null;
  let targetRoleName = `ID: ${roleId}`;

  try {
    guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      return { success: false, error: 'Guild not found by Discord bot client' };
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
      const errorMsg = `Member <@${userId}> (ID: \`${userId}\`) was not found in the guild. The user may have left the server before role assignment.`;
      await dispatchFormattedErrorAlert(guild, logsChannelId, {
        title: '⚠️ Whitelist Role Assignment Skipped: Member Not Found',
        color: 0xf59e0b,
        description: errorMsg,
        fields: [
          { name: '👤 Target User ID', value: `\`${userId}\``, inline: true },
          { name: '🔑 Target Role', value: `<@&${roleId}>`, inline: true },
          { name: '💡 Resolution', value: 'Verify that the applicant has joined your Discord server with the matching account before approving.', inline: false }
        ]
      });
      return { success: false, error: 'Target user member not found in this guild' };
    }

    const botMember = await guild.members.fetch(client.user!.id).catch(() => null);
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const errorMsg = `The bot is missing the **Manage Roles** permission. Cannot grant role <@&${roleId}> to <@${userId}>.`;
      await dispatchFormattedErrorAlert(guild, logsChannelId, {
        title: '🚨 Discord Permission Error: Missing Manage Roles',
        color: 0xef4444,
        description: errorMsg,
        fields: [
          { name: '👤 Applicant', value: `<@${userId}> (\`${member.user.tag}\`)`, inline: true },
          { name: '🔑 Target Role', value: `<@&${roleId}>`, inline: true },
          { name: '🔧 Resolution Steps', value: '1. Open **Discord Server Settings -> Roles**.\n2. Locate the **Vice City Central Bot** role.\n3. Turn on the **"Manage Roles"** permission switch and save.', inline: false }
        ]
      });
      return { success: false, error: 'Bot lacks Manage Roles permission', hierarchyInvalid: true };
    }

    const targetRole = await guild.roles.fetch(roleId).catch(() => null);
    if (!targetRole) {
      const errorMsg = `The configured whitelist role (\`${roleId}\`) does not exist or was deleted from your server.`;
      await dispatchFormattedErrorAlert(guild, logsChannelId, {
        title: '🚨 Whitelist Role Not Found',
        color: 0xef4444,
        description: errorMsg,
        fields: [
          { name: '🔑 Missing Role ID', value: `\`${roleId}\``, inline: true },
          { name: '👤 Target Applicant', value: `<@${userId}>`, inline: true },
          { name: '🔧 Resolution Steps', value: 'Run `/vcc-setup` in your server to link a valid existing role as the Whitelist Role.', inline: false }
        ]
      });
      return { success: false, error: 'Target whitelist role not found in this guild' };
    }

    targetRoleName = targetRole.name;

    // Defensive Role Hierarchy Check
    if (botMember.roles.highest.position <= targetRole.position) {
      const errorMsg = `The bot's highest role is positioned **below or equal to** the target role (\`@${targetRole.name}\`). Discord prevents bots from granting roles higher than their own.`;
      await dispatchFormattedErrorAlert(guild, logsChannelId, {
        title: '⚠️ Role Hierarchy Conflict Detected',
        color: 0xef4444,
        description: errorMsg,
        fields: [
          { name: '👑 Bot Highest Role', value: `\`${botMember.roles.highest.name}\` (Pos: ${botMember.roles.highest.position})`, inline: true },
          { name: '🎯 Whitelist Role', value: `\`${targetRole.name}\` (Pos: ${targetRole.position})`, inline: true },
          { name: '👤 Target Applicant', value: `<@${userId}> (\`${member.user.tag}\`)`, inline: false },
          { name: '🔧 Fix Instructions', value: '1. Go to **Server Settings -> Roles**.\n2. Click and drag the **Vice City Central Bot** role to be **ABOVE** the `@' + targetRole.name + '` role.\n3. Save changes.', inline: false }
        ]
      });
      return { success: false, error: 'Bot role is lower than target role in hierarchy', hierarchyInvalid: true };
    }

    // Atomic role addition with 3x retry and backoff logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastApiError: any = null;

    while (attempts < maxAttempts) {
      try {
        await member.roles.add(roleId, 'VCC Auto-Whitelist Approved');
        return { success: true };
      } catch (addError: any) {
        lastApiError = addError;
        attempts++;
        if (attempts >= maxAttempts) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
      }
    }

    // Handle Discord API error after retry exhaustion
    const errorCode = lastApiError?.code || lastApiError?.status || 'UNKNOWN_API_ERROR';
    const errorDetails = lastApiError?.message || 'Discord REST API rejected role addition request.';

    await dispatchFormattedErrorAlert(guild, logsChannelId, {
      title: '🚨 Discord API Error: Role Assignment Failed',
      color: 0xef4444,
      description: `An error occurred while communicating with the Discord API during role assignment for <@${userId}>.`,
      fields: [
        { name: '👤 Applicant', value: `<@${userId}> (\`${member.user.tag}\`)`, inline: true },
        { name: '🔑 Target Role', value: `<@&${roleId}> (\`${targetRoleName}\`)`, inline: true },
        { name: '⚠️ Error Code', value: `\`${errorCode}\``, inline: true },
        { name: '📋 API Response Details', value: `\`\`\`\n${errorDetails.slice(0, 300)}\n\`\`\``, inline: false },
        { name: '💡 Recommended Action', value: 'Manually assign the role to the applicant or check the bot permissions.', inline: false }
      ]
    });

    return { 
      success: false, 
      error: `Discord API Error (${errorCode}): ${errorDetails}`,
      discordErrorCode: errorCode
    };

  } catch (error: any) {
    console.error(`[VCC Bot Role Grant Error]:`, error);

    if (guild) {
      await dispatchFormattedErrorAlert(guild, logsChannelId, {
        title: '🚨 Unexpected Error During Whitelist Assignment',
        color: 0xef4444,
        description: `An unhandled exception occurred while attempting to grant role \`${targetRoleName}\` to user ID \`${userId}\`.`,
        fields: [
          { name: '⚠️ Exception Message', value: `\`${error?.message || 'Unknown internal error'}\``, inline: false }
        ]
      });
    }

    return { success: false, error: error?.message || 'Internal role assignment error' };
  }
}

interface FormattedAlertPayload {
  title: string;
  color: number;
  description: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

/**
 * Dispatches formatted embed notifications to the designated staff log channel,
 * falling back gracefully to #vcc-alerts, #staff-logs, or other moderator channels.
 */
async function dispatchFormattedErrorAlert(
  guild: any,
  configuredChannelId: string | undefined,
  payload: FormattedAlertPayload
): Promise<void> {
  try {
    let targetChannel: TextChannel | null = null;

    if (configuredChannelId) {
      const chan = await guild.channels.fetch(configuredChannelId).catch(() => null);
      if (chan && chan.isTextBased()) {
        targetChannel = chan as TextChannel;
      }
    }

    if (!targetChannel) {
      // Look for fallback moderator/staff/alerts channel
      const channels = await guild.channels.fetch().catch(() => null);
      if (channels) {
        const fallbackChan = channels.find(
          (c: any) =>
            c &&
            c.isTextBased() &&
            (
              c.name.includes('vcc-alerts') ||
              c.name.includes('alerts') ||
              c.name.includes('staff-log') ||
              c.name.includes('mod-log') ||
              c.name.includes('staff') ||
              c.name.includes('admin')
            )
        );
        if (fallbackChan) {
          targetChannel = fallbackChan as TextChannel;
        }
      }
    }

    if (targetChannel) {
      const embed = new EmbedBuilder()
        .setTitle(payload.title)
        .setColor(payload.color)
        .setDescription(payload.description)
        .setTimestamp();

      if (payload.fields && payload.fields.length > 0) {
        embed.addFields(payload.fields);
      }

      embed.setFooter({
        text: 'Vice City Central • Whitelist Sentinel Alert System'
      });

      await targetChannel.send({ embeds: [embed] });
    } else {
      console.warn(`[VCC Bot Alert Dispatch]: No text channel found to dispatch alert: "${payload.title}" in guild ${guild.name} (${guild.id})`);
    }
  } catch (err) {
    console.warn('[VCC Bot Alert Dispatch Failed]:', err);
  }
}
