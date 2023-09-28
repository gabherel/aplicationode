const { hash, compare } = require('bcryptjs')
const AppError = require('../utils/AppError')
const sqliteConnection = require('../database/sqlite')

class UsersController {
  async create(req, res) {
    const { name, email, password } = req.body

    const database = await sqliteConnection()

    const checkUserExists = await database.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )

    if (checkUserExists) {
      throw new AppError('This email already exists')
    }

    const hashedPassword = await hash(password, 0)

    await database.run(
      'INSERT INTO users ( name, email, password ) VALUES ( ?, ?, ?)',
      [name, email, hashedPassword]
    )

    return res.status(201).json()
  }

  async update(req, res) {
    const { name, email, password, old_password } = req.body
    const { id } = req.params

    const database = await sqliteConnection()
    const user = await database.get('SELECT * FROM users WHERE id = (?)', [id])

    if (!user) {
      throw new AppError('User not found')
    }

    const userWithUpdatedEmail = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    )

    if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
      throw new AppError('This email already used')
    }

    user.name = name ?? user.name
    user.email = email

    if( password && old_password ){
      const checkOldPassword = await compare(old_password, user.password)

      if( !checkOldPassword ){
        throw new AppError('The old password is incorrect')
      }

      user.password = await hash(password, 8)
    }

    await database.run( ` 
      UPDATE users SET
      name = ?,
      email = ?,
      password = ?,
      updated_at = DATETIME('now')
      WHERE id = ?`,
      [user.name, user.email, user.password, id]
    )

    return res.json()
  }
}

module.exports = UsersController