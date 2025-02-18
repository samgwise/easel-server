import t from 'tap';
import { DuckDBInstance } from '@duckdb/node-api';

// Module under test
import { UnitOfStudyAPI, UnitOfStudyRecord } from '../lib/models/unitOfStudy.js'

// Create an in memory database for testing
const db = await DuckDBInstance.create(':memory:');

// app.log.level = 'debug';

t.test('Exercise UnitOfStudy model', async t => {
    const dbConnection = await db.connect();

    const uos = new UnitOfStudyAPI()

    await t.test('Init', async () => {
        await uos.initModel(dbConnection);
    });

    const uosCode = "DECO2017";
    const uosName = "Advanced Web Design";
    const year = 2025;
    const session = 1;
    const siteId = null;

    await t.test('create record', async () => {

        // Action under test
        const deco2017 = { code: uosCode, name: uosName, year: year, session: session, siteId: siteId }
        const result = await uos.newUnitOfStudy(dbConnection, deco2017);

        t.equal(result.id, 1, "New unit of study record returned after creation with id of 1.");
        t.equal(result.code, uosCode, "New unit of study record creation returns UoS code.");
        t.equal(result.name, uosName, "New unit of study record creation returns UoS name.");
    });

    await t.test('list record', async () => {

        // Action under test
        const result = await uos.listUnitsOfStudy(dbConnection);

        t.equal(result[0].id, 1, "Unit of study record returned from list with id of 1.");
        t.equal(result[0].code, uosCode, "Unit of study record list returns UoS code.");
        t.equal(result[0].name, uosName, "Unit of study record list returns UoS name.");
    });
});