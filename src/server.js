const express = require('express');
const app = express();

const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Valorant Shop Bot is running!');
});

app.listen(port, () => {
    console.log(`Anti-sleep server is listening on port ${port}`);
});
