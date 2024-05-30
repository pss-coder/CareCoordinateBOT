import { Scenes } from "telegraf";
import { getPatientAppointment, getPatientLatestUpdate, sendPhotoToSaas, sendUpdatePatientProgressToSAAS } from "./fhir_helper";
import { sendStringToBot } from "./helper";
import { FetchFhirClient, FhirClient } from "@bonfhir/core/r4b";

// Initialize using a OAuth client_credentials flow
// clientId and secret here: https://bonfhir.dev/packages/cli/import
const client: FhirClient = new FetchFhirClient({
    baseUrl: "http://localhost:8103/fhir/R4/",
    auth: {
      tokenUrl: "http://localhost:8103/oauth2/token",
      clientId: "f54370de-eaf3-4d81-a17e-24860f667912",
      clientSecret: "75d8e7d06bf9283926c51d5f461295ccf0b69128e983b6ecdd5a9c07506895de",
    },
  });

// Create a scene for viewing appointments
export const viewAppointmentScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'view_appointment_scene',
    async (ctx) => {
        ctx.reply('Please enter the patient ID to view patient appointment. For Demo: id, an ID is already inserted, enter a random number and send :)');
        return ctx.wizard.next()
    },
    async (ctx) => {
        const patientId = ctx.message?.text.trim();
        // patientId from Patients Resource of Patient ID
        const appts = await getPatientAppointment(client, patientId);
        if (appts.length > 0) {
            var string = ""
            console.log(appts)
            appts.map((appt) => {
                string = 
                string.concat(`patient id: ${appt.identifier[0].value}, \n start: ${new Date(appt.start)} - end: ${new Date(appt.end)} \n ---`,)
            })
            ctx.reply(`Appointment  Details:\n ${string}`)
        } else {
            ctx.reply('No appointment found for the given patient ID.');
        }
        return ctx.scene.leave();
    }
);

// Create a scene for updating progress notes
export const updateProgressScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'update_progress_scene',
    async (ctx) => {
        ctx.reply('Please enter the patient ID to add a progress note. For Demo: id, an ID is already inserted, enter a random number and send :)');
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.patientId = "6010ffe5-2bcc-488b-9c6c-ed99019dd8f1"
        
        ctx.reply('Please type the progress note for patient.');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const note = ctx.message?.text.trim();
        const patientId = ctx.wizard.state.patientId;

        if (await sendUpdatePatientProgressToSAAS(client, note, patientId)) {

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
        }
        return ctx.scene.leave();
    }
);

// Create a scene for viewing progress notes
export const viewProgressScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'view_progress_scene',
    async (ctx) => {
        ctx.reply('Please enter the patient ID to view patient latest progress update. For Demo: id, an ID is already inserted, enter a random number and send :)');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const patientId = ctx.message?.text.trim();
        // patientId from Communication Resource, under Identifier of Patient - Value
        const note = await getPatientLatestUpdate(client, patientId)
        if (note) {
            ctx.reply(`Progress Notes for patient ${patientId} :\n${note}`);
        } else {
           ctx.reply('No progress notes found for the given patient ID.');
        }

        return ctx.scene.leave();
    }
);

// Create a scene for collecting patient consent photo
export const consentPhotoScene = new Scenes.WizardScene<Scenes.WizardContext>(
    'consent_photo_scene',
    async (ctx) => {
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
        sendPhotoToSaas(fileUrl.href)
        
        return ctx.scene.leave();
    }
);