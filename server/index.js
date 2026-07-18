import app from './app.js'

const port = process.env.PORT || process.env.API_PORT || 3000
app.listen(port, () => console.log(`Kvytok API: http://localhost:${port}`))
