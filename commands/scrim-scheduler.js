const { SlashCommandBuilder } = require('@discordjs/builders');
const chrono = require('chrono-node');

const scheduledScrimSchema = require('../models/scheduled-scrim-schema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('scrim-scheduler')
    .setDescription('Schedule a scrim with an automatic reminder!')
    .addChannelOption(option => option.setName('channel').setDescription('The channel the reminder will be sent to').setRequired(true))
    .addStringOption(option => option.setName('date').setDescription('The date the reminder will be sent').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message that will be included').setRequired(true))
    .addRoleOption(option => option.setName('role').setDescription('The role that will be mentioned').setRequired(true)) //TODO: add admin
    ,

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const date = chrono.parseDate(interaction.options.getString('date'));
        const message = interaction.options.getString('message');
        const user = interaction.user.id;
        const role = interaction.options.getRole('role');

        await new scheduledScrimSchema({
            date: new Date(date),
            content: message,
            channel: channel.id,
            user: user,
            role: role.id,
        }).save();

        return interaction.reply({content: `send "${message}" to ${channel} on ${date}`, ephemeral: true});
    }
}