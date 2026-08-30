import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../client';

export const data = new SlashCommandBuilder()
  .setName('apply')
  .setDescription('Get the direct link to submit your whitelist application.');

export async function execute(interaction: CommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId!;

    // Load Bot Guild configuration from memory cache / Firestore
    const config = await getGuildConfig(guildId);

    if (!config) {
      return interaction.editReply({
        content: '⚠️ **Server Configuration Pending**: VCC integration has not been set up yet on this Discord server. Please ask an Administrator to run `/vcc-setup` first.'
      });
    }

    const serverId = config.serverId;
    const serverSlug = (config as any).serverSlug || serverId;

    const embed = new EmbedBuilder()
      .setTitle('✍️ Join our Whitelisted GTA VI Community')
      .setColor(0x3b82f6)
      .setDescription(`We use **Vice City Central (VCC)** to provide safe, fast, automated whitelisting with integrated alt-account verification.\n\nClick the button link below to connect your Discord account, verify your age, and complete your application form!`)
      .addFields(
        { name: '🌐 Application Portal', value: `🌐 **[Apply on Vice City Central](${process.env.APP_URL || 'https://viceintel.app'}/servers/${serverSlug}/apply)**`, inline: false },
        { name: '⚙️ Protection Policy', value: `Your Discord account must be older than \`${config.minAccountAgeDays ?? 14} days\` and have a verified avatar.`, inline: false }
      )
      .setFooter({ text: 'Ensure you link your active Discord account on checkout.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('[apply command execution error]:', error);
    await interaction.editReply({
      content: `❌ **Error rendering application portal link**: ${error?.message || 'Database lookup failed.'}`
    });
  }
}
