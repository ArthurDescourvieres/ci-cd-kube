import app from './app.js'

const port = process.env.PORT ?? 3000

app.listen(port, () => {
  console.log(`ci-cd-kube listening on port ${port}`)
})