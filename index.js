// Require the necessary default, discordJS and mongo classes
const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { token, dbuii } = require('./config.json');
const mongoose = require('mongoose');

// Schema for the database
const scheduledScrimSchema = require('./models/scheduled-scrim-schema');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Create commands list
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

// Connect to the database
mongoose.connect(dbuii, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => console.log('Connected to MongoDB'))
    .catch((err) => console.log(err));

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

// Run all slash commands here
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Query database and send reminders
setInterval(async () => {

	const query = {
		date: { $lte: new Date() }
	}

	// Find all reminders that hav ebeen passed
	const scheduledScrims = await scheduledScrimSchema.find(query);

	// Send all schedules messages
	for (const post of scheduledScrims) {
		const { channel, content, user, date, role } = post

		// Message embed
		const embed = new MessageEmbed()
			.setTitle('__Scrim Reminder__')
			.setDescription(content)
			.setColor('#0099ff')
			.setTimestamp()
			.setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Overwatch_circle_logo.svg/1200px-Overwatch_circle_logo.svg.png')
			.setAuthor({ name: client.users.cache.get(user).username, iconURL: client.users.cache.get(user).avatarURL()})
			.addFields(
				{ name: 'Remember', value: 'React to this message to confirm your attendance.', inline: false},
				{ name: 'Date', value: `${date}`, inline: true },
				{ name: 'Channel', value: channel, inline: true },	
			);

		client.channels.cache.get(channel).send( { content: `<@&${role}>` , embeds: [embed] } );
		// TODO: Format messages to be more user friendly
	}

	// Delete reminders from database
	await scheduledScrimSchema.deleteMany(query);

}, 1000);

// Login to Discord with your client's token
client.login(token);