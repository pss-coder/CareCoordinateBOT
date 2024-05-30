import { sendStringToBot } from "./helper"

// Functions
export function listenForChangesToPatientProgressNotes(socket) {
    socket.on('clientSendUpdate', (data) => {
        console.log("Recieved patient update from server ::", data)
        sendStringToBot(`Live Alert! Patient Update: for patient id: ${data.id} \n Note: ${data.note}`)
      })
}

export function listenForChangesToPatientAppointmentNotes(socket) {
    socket.on('clientSendAppt', (data) => {
        // Execute any command
        console.log("Recieved appointment from server ::", data)
        sendStringToBot(`Live Alert! Appointment Details:\nStart Date: ${data.start.toLocaleString()}\nEnds: ${data.end.toLocaleString()}\nPatient ID: ${data.id}`);
    })
}