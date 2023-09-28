require('express-async-errors')

const migrationsRun = require('./database/sqlite/migrations')

const AppError = require('./utils/AppError')

const express = require('express')

const routes = require('./routes')

const app = express()
app.use(express.json())

app.use(routes)

migrationsRun()

app.use((error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    })
  }

  console.error(error)

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  })
})

const PORT = 3333
app.listen(PORT, () => console.log(`app listening on ${PORT}`))
