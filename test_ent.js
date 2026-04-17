const axios = require('axios');

const accessToken = 'eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJDa0ZqWTBhNWhpSGtUMzl0eUNaTVFBIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU0MDU4LCJpYXQiOjE3NzYzNTA0NTgsImp0aSI6IjNKOVBWclRNVTlZIiwiY2lkIjoicGxheS12YWxvcmFudC13ZWItcHJvZCJ9.O2Zrkkc9i5ROKpirk2MONLx9FaI51LONZeDLedPYDCrcKd5HXmP-TfTx-EkHtg8zXXkv1BJObom30dxaRLW6W2OHSwaTWl3xyGbCEsHycb3j7SHNr1bv-QQ-NEdWTkAQ2EJGUTP0BWAtO2fsgRWHRnkOHke_ZGeIYZDEYonZ7VZOC7HIPYzT5CagHIo4VjA-aA_6DDZw4d3CFclIaRpdezgkYu29RuejYFNs7iRsF3RnlluUDXUYnjLwa6_jrkNAEA4SXOp-j5qHTh8QR_TKWefxZR1Q6LGGADud75lpG9gYK-sI8bngN7LvHZ8N6zy5OIoGGOa_mRjuzQ4_kNEOWg';

async function test() {
    try {
        console.log("Fetching entitlements...");
        const response = await axios.post('https://entitlements.auth.riotgames.com/api/token/v1', {}, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Entitlements OK:", response.data);
    } catch (e) {
        console.log("Entitlements Error:", e.response ? Object.keys(e.response) : e.message);
        if(e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", e.response.data);
            console.log("Headers:", e.response.headers);
        }
    }
}

test();
