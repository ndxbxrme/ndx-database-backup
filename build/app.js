(function() {
  'use strict';
  var fs, glob, path;

  fs = require('fs');

  path = require('path');

  glob = require('glob');
  const AWS = require('aws-sdk');
  const stream = require('stream');

  module.exports = function(ndx) {
    if(process.env.BACKUP_AWS_ID) {
      AWS.config.bucket = process.env.BACKUP_AWS_BUCKET || settings.BACKUP_AWS_BUCKET;
      AWS.config.region = process.env.BACKUP_AWS_REGION || settings.BACKUP_AWS_REGION;
      AWS.config.accessKeyId = process.env.BACKUP_AWS_ID || settings.BACKUP_AWS_ID;
      AWS.config.secretAccessKey = process.env.BACKUP_AWS_KEY || settings.BACKUP_AWS_KEY;
      const S3 = new AWS.S3();
      const s3Stream = require('s3-upload-stream')(S3);
      const doBackup = async () => {
        const m = {
          Bucket: AWS.config.bucket,
          Prefix: ''
        };
        s3.listObjects(m, (e, r) => {
          if(!e) {
            const fileNames = r.Contents.map(item => item.Key);
            const now = new Date().valueOf();
            fileNames.sort((a, b) => a < b ? 1 : -1);
            fileNames.forEach(fileName => {
              const fileDate = +/\d+/.exec(fileName)[0];
              let outDate;
              if(fileDate < now - 365 * 24 * 60 * 60 * 1000) {
                outDate = new Date(new Date(fileDate).toISOString().split(/T/)[0].replace(/\d+-\d+$/, '01-01')).valueOf();
              }
              else if(fileDate < now - 30 * 24 * 60 * 60 * 1000) {
                outDate = new Date(new Date(fileDate).toISOString().split(/T/)[0].replace(/\d+$/, '01')).valueOf();
              }
              else if(fileDate < now - 24 * 60 * 60 * 1000) {
                outDate = new Date(new Date(fileDate).toISOString().split(/T/)[0]).valueOf();
              }
              else {
                outDate = fileDate;
              }
              outFiles[outDate] = outFiles[outDate] || 'BACKUP_' + fileDate + '.json';
            });
            const toSave = Object.values(outFiles);
            const toDelete = fileNames.filter(fileName => !toSave.includes(fileName));
            for(let f=0; f<toDelete.length; f++) {
              const delParams = {
                Bucket: AWS.config.bucket,
                Key: toDelete[f]
              }
              await s3.deleteObject(params).promise();
            }
          }            
        });
        const backupName = 'BACKUP_' + (new Date().valueOf()) + '.json';
        const writeStream = s3Stream.upload({
          Bucket: AWS.config.bucket,
          Key: backupName
        });
        ndx.database.saveDatabase(() => {}, writeStream);
      }
      setInterval(doBackup, 60 * 60 * 1000);
      ndx.app.get('/api/backup/list', ndx.authenticate('superadmin'), function(req, res) {
        const m = {
          Bucket: AWS.config.bucket,
          Prefix: ''
        };
        s3.listObjects(m, (e, r) => {
          if (!e) {
            return res.json(r.Contents.map(item => item.Key));
          } else {
            throw 'glob error';
          }
        });
      });
      return ndx.app.post('/api/backup/restore', ndx.authenticate('superadmin'), function(req, res) {
        var readStream;
        if (req.body.fileName) {
          readStream = S3.getObject({
            Bucket: Aws.config.bucket,
            Key: req.body.fileName
          }).createReadStream();
          ndx.database.restoreFromBackup(readStream);
          res.end('OK');
        } else {
          throw 'no filename';
        }
      });
    }
    else {
      var backupDir, backupInterval, doBackup;
      backupDir = process.env.BACKUP_DIR || ndx.settings.BACKUP_DIR;
      backupInterval = process.env.BACKUP_INTERVAL || ndx.settings.BACKUP_INTERVAL || '120';
      if (backupDir) {
        doBackup = function(cb) {
          var exists, writeStream;
          exists = fs.existsSync(backupDir);
          if (!exists) {
            fs.mkdirSync(backupDir);
          }
          writeStream = fs.createWriteStream(path.join(backupDir, "BACKUP_" + (new Date().valueOf()) + ".json"));
          return ndx.database.saveDatabase(cb, writeStream);
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
        var readStream;
        if (req.body.fileName) {
          if (fs.existsSync(req.body.fileName)) {
            readStream = fs.createReadStream(req.body.fileName);
            ndx.database.restoreFromBackup(readStream);
            return res.end('OK');
          } else {
            throw 'can\'t find file';
          }
        } else {
          throw 'no filename';
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=app.js.map
