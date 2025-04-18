import { DuckDBConnection, DuckDBValue, DuckDBPreparedStatement } from '@duckdb/node-api';
import _ from 'radashi';

export interface UnitOfStudy {
    code: string;
    name: string;
    year: number;
    session: number;
    siteId: string | null;
}

export interface UnitOfStudyRecord extends UnitOfStudy {
    id: number;
}

// This should be moved next to listUnitsOfStudy
type listUnitsOfStudyRow = [number, string, string, number, string, string];

export class UnitOfStudyAPI {
    // Function for setting up the required tables and sequences in the database
    async initModel(db: DuckDBConnection) {
        await db.run(`
            CREATE SEQUENCE IF NOT EXISTS UnitOfStudyIdSeq START 1;
            CREATE TABLE IF NOT EXISTS unitOfStudy (
                    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('UnitOfStudyIdSeq'),
                    code VARCHAR(32) NOT NULL,
                    name VARCHAR NOT NULL,
                    year INTEGER,
                    session TINYINT NOT NULL,
                    lms_site_id VARCHAR,
                    created TIMESTAMP NOT NULL,
                    modified TIMESTAMP NOT NULL,
                )
        `)
    }

    async listUnitsOfStudy(db: DuckDBConnection): Promise<UnitOfStudyRecord[]> {
        const reader = await db.runAndReadAll(`
            SELECT id, code, name, year, session, lms_site_id FROM unitOfStudy;
        `);

        return reader.getRows().map(row => ({
                id: row[0] as number,
                code: row[1] as string,
                name: row[2] as string,
                year: row[3] as number,
                session: row[4] as number,
                siteId: row[5] as string,
            })
        );
    }

    // Example of the tuple casting trick to make type assertions simpler and less error prone.
    // Now all this needs is a refactor to move the type definition next to the function body.
    async listUnitsOfStudy2<T>(db: DuckDBConnection, transform: (value: listUnitsOfStudyRow) => T): Promise<T[]> {
        const reader = await db.runAndReadAll(`
            SELECT id, code, name, year, session, lms_site_id FROM unitOfStudy;
        `);

        return reader.getRows()
            .map(r => r as listUnitsOfStudyRow)
            .map(transform)
    }

    async newUnitOfStudy(db: DuckDBConnection, uos: UnitOfStudy): Promise<UnitOfStudyRecord> {
        const insert = await db.prepare(`
            INSERT INTO unitOfStudy (code, name, year, session, lms_site_id, created, modified) VALUES (?, ?, ?, ?, ?, current_timestamp, current_timestamp) RETURNING (id)
            `);

        // Bind happy path values in bulk
        const values = [uos.code, uos.name, uos.year, uos.session];
        insert.bind(values);

        // Handle dispatching to null when needed
        bindMaybe(insert, (s, v) => s.bindVarchar(5, v), uos.siteId)

        // Go!
        const reader = await insert.runAndReadAll();

        return {
            id: reader.getRows()[0][0] as number,
            ...uos
        }
    }
}

function bindMaybe<T>(statement: DuckDBPreparedStatement, binder: (statement: DuckDBPreparedStatement, value: NonNullable<T>) => any, value: T) {
    // Handle dispatching to null when needed
    if (value === null || value === undefined) {
        statement.bindNull(5)
    }
    else {
        binder(statement, value)
    }
}
