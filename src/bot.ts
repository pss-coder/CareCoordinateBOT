import { Markup, Scenes, Telegraf, session } from "telegraf";
import { io } from "socket.io-client";
import 'dotenv/config'
import { consentPhotoScene, updateProgressScene, viewAppointmentScene, viewProgressScene } from "./scenes";
import { listenForChangesToPatientAppointmentNotes, listenForChangesToPatientProgressNotes } from "./socket_listeners";

const token: string = process.env.BOT_TOKEN ?  process.env.BOT_TOKEN : "empty"
// console.log(token)

// Initalise Bot
const bot = new Telegraf<Scenes.WizardContext>(token);

// Register Stage
const stage = new Scenes.Stage<Scenes.WizardContext>([viewAppointmentScene, updateProgressScene, viewProgressScene, consentPhotoScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    ctx.reply('Welcome! Please select an option.', 
        Markup.inlineKeyboard([
            Markup.button.callback('View Patient Appointment', 'view_appt'),
            Markup.button.callback('Update Patient Progress', 'update_progress'),
            Markup.button.callback('View Patient Progress', 'view_progress'),
            Markup.button.callback('Upload Patient Consent Form', 'consent_photo')
        ], { columns: 1 })
    );
});

bot.action('view_appt', (ctx) => ctx.scene.enter('view_appointment_scene'));
bot.action('view_progress', (ctx) => ctx.scene.enter('view_progress_scene'));
bot.action('update_progress', (ctx) => ctx.scene.enter('update_progress_scene'));
bot.action('consent_photo', (ctx) => ctx.scene.enter('consent_photo_scene'));


// Register commands
bot.command('view_appt', (ctx) => ctx.scene.enter('view_appointment_scene'));
bot.command('view_progress', (ctx) => ctx.scene.enter('view_progress_scene'));
bot.command('update_progress', (ctx) => ctx.scene.enter('update_progress_scene'));
bot.command('consent_photo', (ctx) => ctx.scene.enter('consent_photo_scene'));


// Listen Socket - 
const socket = io("http://localhost:3000")

// SOCKET CONSUMERS - for live alerts
listenForChangesToPatientProgressNotes(socket)
listenForChangesToPatientAppointmentNotes(socket)

// Launch
bot.launch()
    .then(() => console.log('Bot started'))
    .catch(err => console.error('Error launching bot', err));


// Safe Termination
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));