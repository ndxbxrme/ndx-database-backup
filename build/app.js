(function() {
  'use strict';
  var fs, glob, path;

  fs = require('fs');

  path = require('path');

  glob = require('glob');

  module.exports = function(ndx) {
    var backupDir, backupInterval, doBackup;
    backupDir = process.env.BACKUP_DIR || ndx.settings.BACKUP_DIR;
    backupInterval = process.env.BACKUP_INTERVAL || ndx.settings.BACKUP_INTERVAL || '120';
    if (backupDir) {
      doBackup = function(cb) {
        var d, db, exists, uri;
        exists = fs.existsSync(backupDir);
        if (!exists) {
          fs.mkdirSync(backupDir);
        }
        db = ndx.database.getDb();
        d = new Date();
        uri = path.join(backupDir, 'BACKUP_' + d.valueOf() + '.json');
        return fs.writeFile(uri, JSON.stringify(db), function(e) {
          return typeof cb === "function" ? cb(e, null) : void 0;
        });
      };
      setInterval(doBackup, +backupInterval * 60 * 1000);
    }
    ndx.app.get('/api/backup/list', ndx.authenticate('superadmin'), function(req, res) {
      return glob(path.join(backupDir, 'BACKUP_*.json'), function(e, r) {
        if (!e) {
          return res.json(r);
        } else {
          throw 'glob error';
        }
      });
    });
    return ndx.app.post('/api/backup/restore', ndx.authenticate('superadmin'), function(req, res) {
      var text;
      if (req.body.fileName) {
        if (fs.existsSync(req.body.fileName)) {
          text = fs.readFileSync(req.body.fileName, 'utf8');
          ndx.database.restoreFromBackup(text);
          return res.end('OK');
        } else {
          throw 'can\'t find file';
        }
      } else {
        throw 'no filename';
      }
    });
  };

}).call(this);

//# sourceMappingURL=app.js.map
