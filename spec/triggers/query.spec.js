/* eslint-disable no-unused-vars */
const sinon = require('sinon');
const { expect } = require('chai');
const jsforce = require('jsforce');
const logger = require('@elastic.io/component-logger')();

const query = require('../../lib/entry');

const configuration = {
  apiVersion: '39.0',
  oauth: {
    instance_url: 'https://example.com',
    refresh_token: 'refresh_token',
    access_token: 'access_token',
  },
  query: 'SELECT ID, Name from Contact',
};
const message = {
  body: {},
};
const snapshot = {};
let emitter;
let conn;
const records = require('../testData/trigger.results.json');


describe('Query trigger test', () => {
  beforeEach(() => {
    emitter = {
      emit: sinon.spy(),
      logger,
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should be called with emitAll behavior', (done) => {
    conn = sinon.stub(jsforce, 'Connection').callsFake(() => {
      const connStub = {
        sobject() {
          return connStub;
        },
        on() {
          return connStub;
        },
        select() {
          return connStub;
        },
        where() {
          return connStub;
        },
        sort() {
          return connStub;
        },
        execute() {
          return records;
        },
      };
      return connStub;
    });

    configuration.outputMethod = 'emitAll';

    query.processQuery.call(emitter, configuration.query, configuration)
      .then(() => {
        expect(emitter.emit.withArgs('error').callCount).to.be.equal(1);
        done();
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should be called with arg data five times', async () => {
    conn = sinon.stub(jsforce, 'Connection').callsFake(() => {
      const connStub = {
        sobject() {
          return connStub;
        },
        on() {
          return connStub;
        },
        select() {
          return connStub;
        },
        where() {
          return connStub;
        },
        sort() {
          return connStub;
        },
        execute() {
          return records;
        },
      };
      return connStub;
    });

    configuration.outputMethod = 'emitIndividually';

    await query
      .processQuery.call(emitter, configuration.query, configuration);
    expect(emitter.emit.withArgs('data').callCount).to.be.equal(records.length);
    expect(emitter.emit.withArgs('snapshot').callCount).to.be.equal(1);
    expect(emitter.emit.withArgs('snapshot').getCall(0).args[1].previousLastModified).to.be.equal(records[records.length - 1].LastModifiedDate);
  });

  it('should not be called with arg data and snapshot', async () => {
    conn = sinon.stub(jsforce, 'Connection').callsFake(() => {
      const connStub = {
        sobject() {
          return connStub;
        },
        on() {
          return connStub;
        },
        select() {
          return connStub;
        },
        where() {
          return connStub;
        },
        sort() {
          return connStub;
        },
        execute() {
          return [];
        },
      };
      return connStub;
    });
    await query
      .processQuery.call(emitter, configuration.query, configuration);
    expect(emitter.emit.withArgs('data').callCount).to.be.equal(0);
    expect(emitter.emit.withArgs('snapshot').callCount).to.be.equal(0);
  });

  it('should not be called with arg data', async () => {
    conn = sinon.stub(jsforce, 'Connection').callsFake(() => {
      const connStub = {
        sobject() {
          return connStub;
        },
        on() {
          return connStub;
        },
        select() {
          return connStub;
        },
        where() {
          return connStub;
        },
        sort() {
          return connStub;
        },
        execute(cfg, processResults) {
          return connStub;
        },
      };
      return connStub;
    });
    snapshot.previousLastModified = '2019-28-03T00:00:00.000Z';
    await query
      .processQuery.call(emitter, configuration.query, configuration);
    expect(emitter.emit.withArgs('data').callCount).to.be.equal(0);
    expect(emitter.emit.withArgs('snapshot').callCount).to.be.equal(0);
  });

  it('should be called with arg error', async () => {
    conn = sinon.stub(jsforce, 'Connection').callsFake(() => {
      const connStub = {
        sobject() {
          return connStub;
        },
        on() {
          return connStub;
        },
        select() {
          return connStub;
        },
        where() {
          return connStub;
        },
        sort() {
          return connStub;
        },
        execute() {
          return [];
        },
      };
      return connStub;
    });
    snapshot.previousLastModified = '2019-28-03T00:00:00.000Z';
    configuration.sizeOfPollingPage = 'test';
    await query
      .processQuery.call(emitter, configuration.query, configuration);
    expect(emitter.emit.withArgs('error').callCount).to.be.equal(1);
    expect(emitter.emit.withArgs('data').callCount).to.be.equal(0);
    expect(emitter.emit.withArgs('snapshot').callCount).to.be.equal(0);
  });
});