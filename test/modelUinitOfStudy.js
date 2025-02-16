import t from 'tap';
import { DuckDBInstance } from '@duckdb/node-api';

// Module under test
import { UnitOfStudyAPI } from '../lib/models/unitOfStudy.js'

// Create an in memory database for testing
const db = await DuckDBInstance.create(':memory:');

// app.log.level = 'debug';

t.test('Exercise UnitOfStudy model', async t => {
    const dbConnection = await db.connect();

    const uos = new UnitOfStudyAPI()

    await t.test('Init', async () => {
        await uos.initModel(dbConnection);
    });

    await t.test('create record', async () => {
        const uosCode = "DECO2017";
        const uosName = "Advanced Web Design";

        // Action under test
        const result = await uos.newUnitOfStudy(dbConnection, uosCode, uosName);

        t.ok(result.length === 3, "New unit of study record creation returns 3 element tuple.");

        t.ok(typeof result[0] === "number", "New unit of study record creation returns id.");
        t.ok(result[0] > 0, `New unit of study record creation returns id greater than 0. But value was ${result[0]}`);
        t.equal(result[1], uosCode, "New unit of study record creation returns UoS code.");
        t.equal(result[2], uosName, "New unit of study record creation returns UoS name.");
    });
});