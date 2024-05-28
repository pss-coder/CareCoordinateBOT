import { Composer, Markup, Scenes, Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'

import { FetchFhirClient, FhirClient, build } from "@bonfhir/core/r4b";
import { useFhirCreateMutation } from "@bonfhir/query/r4b";


import { io } from "socket.io-client";
import { Socket } from "socket.io";
// import { BaseScene, Stage } from 'telegraf/scenes';

const bot = new Telegraf<Scenes.WizardContext>('7174167825:AAHJ4TergSi7IFkZRkeHJx1_Iw9mMr4Jztc');

// Initialize using a OAuth client_credentials flow
const client: FhirClient = new FetchFhirClient({
    baseUrl: "http://localhost:8103/fhir/R4/",
    auth: {
      tokenUrl: "http://localhost:8103/oauth2/token",
      clientId: "f54370de-eaf3-4d81-a17e-24860f667912",
      clientSecret: "75d8e7d06bf9283926c51d5f461295ccf0b69128e983b6ecdd5a9c07506895de",
    },
  });

// Create a scene for viewing appointments
const viewAppointmentScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'view_appointment_scene',
    async (ctx) => {
        ctx.reply('Please enter the patient ID to view patient appointment. For Demo: id, an ID is already inserted, enter a random number and send :)');
        //console.log(ctx.wizard.cursor + 1)
        //console.log(ctx.wizard.next())
        return ctx.wizard.next()
    },
    async (ctx) => {
        const patientId = ctx.message?.text.trim();
        //const appointment = appointments.find(app => app.patientId === patientId);

        const appts = await getPatientAppointment(client, "6010ffe5-2bcc-488b-9c6c-ed99019dd8f1");
                
        if (appts.length > 0) {

            var string = ""
            console.log(appts)

            appts.map((appt) => {
                // return {
                //     pt_name: `${appt.identifier[0].value}`,
                //     start: new Date(`${appt.start}`),
                //     end: new Date(`${appt.end}`)
                // }
                string = string.concat(`patient id: ${appt.identifier[0].value}, \n start: ${new Date(appt.start)} - end: ${new Date(appt.end)} \n ---`,)
            })
            ctx.reply(`Appointment  Details:\n ${string}`)

            // ctx.reply(`Appointment Details:\nStart Date: ${appt.start.toLocaleString()}\nEnds: ${appt.end.toLocaleString()}\nPatient ID: ${appt.pt_name}`);
        } else {
            ctx.reply('No appointment found for the given patient ID.');
        }
        return ctx.scene.leave();
    }
);

// Create a scene for updating progress notes
const updateProgressScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'update_progress_scene',
    (ctx) => {
        ctx.reply('Please enter the patient ID to add a progress note. For Demo: id, an ID is already inserted, enter a random number and send :)');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.patientId = "6010ffe5-2bcc-488b-9c6c-ed99019dd8f1"
        
        ctx.reply('Please type the progress note for patient.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const note = ctx.message?.text.trim();
        const patientId = ctx.wizard.state.patientId;
        //progressNotes.push({ patientId, note });

        if (await sendUpdatePatientProgressToSAAS(note, patientId) {

            const query = new URLSearchParams({
              id: patientId ,
              type: 'update',
              note: note
            });
             
              await fetch(`http://localhost:3000/api/notification?${query.toString()}`, {
              method: "GET"
            })
              .then((response) => response.text())
              .then((body) => {
                console.log(body);
                sendStringToBot("Progress note updated successfully!");
                //isSuccessCallback(true)
              })
              .catch((error) => {
                console.log(error)
                sendStringToBot('Something went wrong, please try again!');
              });


            // ctx.reply('Progress note added successfully!');
            // return ctx.scene.leave();
        }

        // ctx.reply('Something went wrong, please try again!');
        return ctx.scene.leave();
    }
);

// Create a scene for viewing progress notes
const viewProgressScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'view_progress_scene',
    (ctx) => {
        ctx.reply('Please enter the patient ID to view patient latest progress update. For Demo: id, an ID is already inserted, enter a random number and send :)');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const patientId = ctx.message?.text.trim();

        const note = await getPatientLatestUpdate(client, "cbf03281-fa86-430c-acb3-b1386b37e34f")

        //const notes = progressNotes.filter(note => note.patientId === patientId);
        if (note) {
            // const formattedNotes = notes.map(note => `Note: ${note.note}`).join('\n');
            ctx.reply(`Progress Notes for patient ${"cbf03281-fa86-430c-acb3-b1386b37e34f"} :\n${note}`);
        } else {
           ctx.reply('No progress notes found for the given patient ID.');
        }

        return ctx.scene.leave();
    }
);

// Create a scene for collecting patient consent photo
const consentPhotoScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'consent_photo_scene',
    (ctx) => {
        ctx.reply('Please send the patient consent photo.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const photo = ctx.message?.photo;
        console.log(photo)
        if (!photo) {
            ctx.reply('No photo received. Please send the patient consent photo.');
            return ctx.wizard.selectStep(ctx.wizard.cursor); // stay in the current step
        }
        
        const fileId = photo[photo.length - 1].file_id; // get the highest resolution photo
        const fileUrl = await ctx.telegram.getFileLink(fileId);

        // Pass URL to consent

        console.log(fileUrl)

        sendPhotoToSaas(fileUrl.href)

        // Use fetch to send the photo to a POST endpoint
        // try {
        //     const response = await fetch('YOUR_RESTFUL_API_ENDPOINT', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({ fileUrl: fileUrl.href })
        //     });
            
        //     if (response.ok) {
        //         ctx.reply('Consent photo uploaded successfully!');
        //     } else {
        //         ctx.reply('Failed to upload consent photo. Please try again.');
        //     }
        // } catch (error) {
        //     console.error('Error uploading photo:', error);
        //     ctx.reply('An error occurred while uploading the photo. Please try again.');
        // }
        
        return ctx.scene.leave();
    }
);

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


bot.command('view_appt', (ctx) => ctx.scene.enter('view_appointment_scene'));
bot.command('view_progress', (ctx) => ctx.scene.enter('view_progress_scene'));
bot.command('update_progress', (ctx) => ctx.scene.enter('update_progress_scene'));
bot.command('consent_photo', (ctx) => ctx.scene.enter('consent_photo_scene'));




bot.launch()
    .then(() => console.log('Bot started'))
    .catch(err => console.error('Error launching bot', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


// Helper Tool
async function getPatientAppointment(client: FhirClient, patientId: String) {
    const result = await client.searchAllPages("Appointment");
    var appointments = []

    result.searchMatch().map(appt => {
        if (appt.identifier) {
          //appointments.push(appt)
          appt.identifier?.map(item => {
                if (item.value === patientId) {
                  appointments.push(appt)
                }
            })
        }
    })
    // console.log(appointments)

    return appointments

    // return firstObservation.note[0]
    // console.log(appt)
}

async function getPatientLatestUpdate(client: FhirClient, patientId: String) {

    const result = await client.search("Communication", (search) =>
        search
          ._sort("-_lastUpdated")
          ._count(1)
    );

    const allMatchingObservations = result.searchMatch();
    const firstObservation = allMatchingObservations[0]!;

    console.log(firstObservation.note[0].text)

    return firstObservation.note[0].text;
}

// DisplayPatientProgressNotes()


// Using Socket - 
const socket = io("http://localhost:3000")

// SOCKET CONSUMERS
listenForChangesToPatientProgressNotes()

listenForChangesToPatientAppointmentNotes()

// await sendPhotoToSaas(img_url: "string here")

function listenForChangesToPatientProgressNotes() {
    socket.on('clientSendUpdate', (data) => {
        console.log("Recieved patient update from server ::", data)
        sendStringToBot(`Patient Update: for patient id: ${data.id} \n Note: ${data.note}`)
      })
}

function listenForChangesToPatientAppointmentNotes() {
    socket.on('clientSendAppt', (data) => {
        // Execute any command
        console.log("Recieved appointment from server ::", data)
        sendStringToBot(`Appointment Details:\nStart Date: ${data.start.toLocaleString()}\nEnds: ${data.end.toLocaleString()}\nPatient ID: ${data.id}`);
    })
}

async function sendUpdatePatientProgressToSAAS(update: string, patientId: string) {

    const newCommunication = await client.create(
        build("Communication", {
            status: "in-progress",
            identifier: [
              {
                system: "Patient",
                value: patientId
              }
            ],
            note: [
              { "text": update,
                "time": new Date().toISOString()
              }
            ]
          })
    );

    console.log(newCommunication)

    return newCommunication
}


async function sendPhotoToSaas(img_url: string) {
    // Send Photo URL to API
        // pass to socket, and update IMAGE
        // call fetch api once success
        console.log("sending image", img_url)
        const query = new URLSearchParams({ img_url: img_url, type: 'consent_verification', });

        await fetch(`http://localhost:3000/api/notification?${query.toString()}`, {
            method: "GET"
              })
            .then((response) => response.text())
            .then((body) => {
                console.log('patient photo sent to platform')
                sendStringToBot("Consent Sent! Verifying in Process... I will get back shortly.")
                sendStringToBot("Consent Received and Verified!")
                // send message to user
            })
            .catch((error) => console.log(error));
    
}



// FETCH SEND MESSAGE HELPER

function sendStringToBot(message: String) {
    const BOT_TOKEN = '7174167825:AAHJ4TergSi7IFkZRkeHJx1_Iw9mMr4Jztc';
    const CHAT_ID = '@ocp_testt';
    //const MESSAGE = 'Hello, this is a test message!';

    // Telegram API endpoint
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    // Data to be sent in the POST request
    const requestBody = {
        chat_id: CHAT_ID,
        text: message
    };

    // Options for the fetch request
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    };

    // Sending the message
    fetch(TELEGRAM_API_URL, requestOptions)
        .then(response => response.json())
        .then(data => {
            console.log('Message sent successfully:', data);
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
}
