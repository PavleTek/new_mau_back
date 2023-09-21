1: `npm install`

2: create an empty mysql database locally and have it running

3: get the url of the db, go to the .env file, and change the `DATABASE_URL` parameter to it

3: `prisma generate`, this will generate the table structure for the database

4: `node index.js`, for running the back end on localhost:3000, which is what the front end uses

5: open new terminal while index.js is running, `node initialPopulate.js`, this will create users "username: admin, password: admin", and "username: user, password: user"
which are needed since all funcitons require authentication

6: generators, raus, must be created through front end, since they need a central Id, RawData, needs a rau Id so it can be created through custom functions, examples might be found on testPrisma.js
