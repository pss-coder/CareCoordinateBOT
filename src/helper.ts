// SEND MESSAGE HELPER - via Fetch API Call
function sendStringToBot(message: String) {
    const BOT_TOKEN = process.env.BOT_TOKEN
    const CHAT_ID = '@group_id';
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


export {sendStringToBot}