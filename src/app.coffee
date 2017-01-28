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
      db = ndx.database.getDb()
      d = new Date()
      uri = path.join backupDir, 'BACKUP_' + d.valueOf() + '.json'
      fs.writeFile uri, JSON.stringify(db), (e) ->
        cb? e, null
    setInterval doBackup, +backupInterval * 60 * 1000
  ndx.app.get '/api/backup/list', ndx.authenticate('admin'), (req, res) ->
    glob path.join(backupDir, 'BACKUP_*.json'), (e, r) ->
      if not e
        res.json r
      else
        res.json
          error: 'glob error'
  ndx.app.post '/api/backup/restore', ndx.authenticate('admin'), (req, res) ->
    if req.body.fileName
      if fs.existsSync req.body.fileName
        text = fs.readFileSync req.body.fileName, 'utf8'
        ndx.database.restoreFromBackup text
        res.end 'OK'
      else
        res.json
          error: 'can\'t find file'
    else
      res.json
        error: 'no filename'
      
      