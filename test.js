const { authenticate } = require('./src/api/riotAuth');

async function test() {
    try {
        console.log("Testing auth...");
        const result = await authenticate("dummyyy123444", "Dummy123456789");
        console.log(result);
    } catch(err) {
        console.log("CATCH: ", err.message);
    }
}
test();
