# ndx-database-backup 
### schedules regular database backups for [ndx-framework](https://github.com/ndxbxrme/ndx-framework)
`currently only works with [ndxdb](https://github.com/ndxbxrme/ndxdb)`  
install with  
`npm install --save ndx-database-backup`  
## what it does
ndx-database-backup saves a copy of your database to the location you specify on a regular schedule  
it also provides superadmin authenticated routes to list and restore backups  

## routes
`GET` `/api/backup/list` -> returns a list of available backup files  
`POST` `/api/backup/restore` -> restores a backed up file, expects an object containing the filename to restore `{fileName:'myBackup.json'}`
## coming soon
  - backup to AWS