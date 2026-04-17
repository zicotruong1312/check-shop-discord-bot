const { Auth } = require('@valapi/auth');

async function test() {
    try {
        const auth = new Auth({
            request: {
                headers: {
                    'User-Agent': 'ShooterGame/13 Windows/10.0.19044.1.256.64bit'
                }
            }
        });
        console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(auth)));
        
        await auth.login("dummyusername", "dummypassword");
        
        console.log("Tokens:", auth.subject.accessToken);
    } catch(err) {
        console.log("CATCH: ", err.message);
    }
}
test();
