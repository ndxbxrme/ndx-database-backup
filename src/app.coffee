'use strict'

fs = require 'fs'
path = require 'path'
glob = require 'glob'

module.exports = (ndx) ->
  backupDir = process.env.BACKUP_DIR or ndx.settings.BACKUP_DIR
  backupInterval = process.env.BACKUP_INTERVAL or ndx.settings.BACKUP_INTERVAL or '120'
  if backupDir
    doBackup = (cb) ->
      exists = fs.existsSync backupDir
      if not exists
        fs.mkdirSync backupDir
      writeStream = fs.createWriteStream path.join backupDir, "BACKUP_#{new Date().valueOf()}.json"
      ndx.database.saveDatabase cb, writeStream
    setInterval doBackup, +backupInterval * 60 * 1000
  ndx.app.get '/api/backup/list', ndx.authenticate('superadmin'), (req, res) ->
    glob path.join(backupDir, 'BACKUP_*.json'), (e, r) ->
      if not e
        res.json r
      else
        throw 'glob error'
  ndx.app.post '/api/backup/restore', ndx.authenticate('superadmin'), (req, res) ->
    if req.body.fileName
      if fs.existsSync req.body.fileName
        readStream = fs.createReadStream req.body.fileName
        ndx.database.restoreFromBackup readStream
        res.end 'OK'
      else
        throw 'can\'t find file'
    else
      throw 'no filename'
      
      