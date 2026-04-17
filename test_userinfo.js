const axios = require('axios');

const accessToken = 'eyJraWQiOiJyc28tcHJvZC0yMDI0LTExIiwiYWxnIjoiUlMyNTYifQ.eyJwcCI6eyJjIjoiYXMifSwic3ViIjoiMDRmMzU4ODEtNjcxMS01OTJkLTg3ZDEtNGM3NTFkM2U3OTMwIiwic2NwIjpbXSwiYWNyIjoidXJuOnJpb3Q6YnJvbnplIiwiZGF0Ijp7ImMiOiJhczEiLCJsaWQiOiJDa0ZqWTBhNWhpSGtUMzl0eUNaTVFBIn0sImFtciI6WyJwYXNzd29yZCJdLCJpc3MiOiJodHRwczovL2F1dGgucmlvdGdhbWVzLmNvbSIsInBsdCI6eyJkZXYiOiJ1bmtub3duIiwiaWQiOiJ3ZWIifSwiZXhwIjoxNzc2MzU0MDU4LCJpYXQiOjE3NzYzNTA0NTgsImp0aSI6IjNKOVBWclRNVTlZIiwiY2lkIjoicGxheS12YWxvcmFudC13ZWItcHJvZCJ9.O2Zrkkc9i5ROKpirk2MONLx9FaI51LONZeDLedPYDCrcKd5HXmP-TfTx-EkHtg8zXXkv1BJObom30dxaRLW6W2OHSwaTWl3xyGbCEsHycb3j7SHNr1bv-QQ-NEdWTkAQ2EJGUTP0BWAtO2fsgRWHRnkOHke_ZGeIYZDEYonZ7VZOC7HIPYzT5CagHIo4VjA-aA_6DDZw4d3CFclIaRpdezgkYu29RuejYFNs7iRsF3RnlluUDXUYnjLwa6_jrkNAEA4SXOp-j5qHTh8QR_TKWefxZR1Q6LGGADud75lpG9gYK-sI8bngN7LvHZ8N6zy5OIoGGOa_mRjuzQ4_kNEOWg';

async function test() {
    try {
        console.log("Fetching UserInfo...");
        const response = await axios.get('https://auth.riotgames.com/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log("UserInfo OK:", response.data);
    } catch (e) {
        console.log("UserInfo Error:", e.response ? e.response.status : e.message);
    }
}

test();
