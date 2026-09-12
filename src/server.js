import app from './app.js'
import { init } from './db.js'

const port = process.env.PORT ?? 3000

await init()

app.listen(port, () => {
  console.log(`ci-cd-kube listening on port ${port}`)
})
