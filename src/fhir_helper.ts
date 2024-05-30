import { sendStringToBot } from "./helper";
import { FhirClient, build } from "@bonfhir/core/r4b";

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



async function sendUpdatePatientProgressToSAAS(client: FhirClient, update: string, patientId: string) {

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

export {getPatientAppointment, getPatientLatestUpdate, sendPhotoToSaas, sendUpdatePatientProgressToSAAS}