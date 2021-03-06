const nock = require('nock');
const sinon = require('sinon');
const chai = require('chai');
const logger = require('@elastic.io/component-logger')();
const entry = require('../lib/entry.js');
const objectDescription = require('./testData/objectDescriptionForMetadata');
const objectFullDescription = require('./testData/objectDescription');
const expectedMetadataOut = require('./testData/expectedMetadataOut');
const objectsList = require('./testData/objectsList');
const oAuthUtils = require('../lib/helpers/oauth-utils.js');
const common = require('../lib/common.js');

const { expect } = chai;
let emitter;

describe('Test entry', () => {
  beforeEach(() => {
    emitter = {
      emit: sinon.spy(),
      logger,
    };
    sinon.stub(entry, 'SalesforceEntity').callsFake(() => new entry.SalesforceEntity(emitter));
    sinon.stub(oAuthUtils, 'refreshAppToken').callsFake((log, component, conf, next) => {
      const refreshedCfg = conf;
      refreshedCfg.oauth.access_token = 'aRefreshedToken';
      next(null, refreshedCfg);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Test getMetaModel', () => {
    it('Get Out Metadata, other entity type', (done) => {
      nock('http://localhost:1234')
        .matchHeader('Authorization', 'Bearer aRefreshedToken')
        .get(`/services/data/v${common.globalConsts.SALESFORCE_API_VERSION}/sobjects/Event/describe`)
        .reply(200, JSON.stringify(objectDescription));

      const cfg = {
        sobject: 'Event',
        oauth: {
          instance_url: 'http://localhost:1234',
          access_token: 'aToken',
        },
      };
      entry.getMetaModel.call(emitter, cfg, (error, result) => {
        if (error) return done(error);
        try {
          expect(error).to.equal(null);
          expect(result).to.deep.equal({ out: expectedMetadataOut });
          expect(emitter.emit.withArgs('updateKeys').callCount).to.be.equal(1);
          return done();
        } catch (e) {
          return done(e);
        }
      });
    });
  });

  describe('Test objectTypes', () => {
    it('should return object types', (done) => {
      nock('http://localhost:1234')
        .matchHeader('Authorization', 'Bearer aRefreshedToken')
        .get(`/services/data/v${common.globalConsts.SALESFORCE_API_VERSION}/sobjects`)
        .reply(200, JSON.stringify(objectsList));

      const cfg = {
        object: 'Event',
        oauth: {
          instance_url: 'http://localhost:1234',
          access_token: 'aToken',
        },
      };
      entry.objectTypes.call(emitter, cfg, (error, result) => {
        if (error) return done(error);
        try {
          expect(error).to.equal(null);
          expect(result).to.deep.equal({ Account: 'Account', AccountContactRole: 'Account Contact Role' });
          expect(emitter.emit.withArgs('updateKeys').callCount).to.be.equal(1);
          return done();
        } catch (e) {
          return done(e);
        }
      });
    });
  });

  describe('Test linkedObjectTypes', () => {
    it('should return linked object types', (done) => {
      nock('http://localhost:1234')
        .matchHeader('Authorization', 'Bearer aRefreshedToken')
        .get(`/services/data/v${common.globalConsts.SALESFORCE_API_VERSION}/sobjects/Event/describe`)
        .reply(200, objectFullDescription);

      const cfg = {
        object: 'Event',
        oauth: {
          instance_url: 'http://localhost:1234',
          access_token: 'aToken',
        },
      };

      const expectedResult = {
        MasterRecord: 'Contact (MasterRecord)',
        Account: 'Account (Account)',
        ReportsTo: 'Contact (ReportsTo)',
        Owner: 'User (Owner)',
        CreatedBy: 'User (CreatedBy)',
        LastModifiedBy: 'User (LastModifiedBy)',
        '!AccountContactRoles': 'AccountContactRole (AccountContactRoles)',
        '!ActivityHistories': 'ActivityHistory (ActivityHistories)',
        '!Assets': 'Asset (Assets)',
        '!Attachments': 'Attachment (Attachments)',
        '!CampaignMembers': 'CampaignMember (CampaignMembers)',
        '!Cases': 'Case (Cases)',
        '!CaseContactRoles': 'CaseContactRole (CaseContactRoles)',
        '!Feeds': 'ContactFeed (Feeds)',
        '!Histories': 'ContactHistory (Histories)',
        '!Shares': 'ContactShare (Shares)',
        '!ContractsSigned': 'Contract (ContractsSigned)',
        '!ContractContactRoles': 'ContractContactRole (ContractContactRoles)',
        '!EmailStatuses': 'EmailStatus (EmailStatuses)',
        '!FeedSubscriptionsForEntity': 'EntitySubscription (FeedSubscriptionsForEntity)',
        '!Events': 'Event (Events)',
        '!Notes': 'Note (Notes)',
        '!NotesAndAttachments': 'NoteAndAttachment (NotesAndAttachments)',
        '!OpenActivities': 'OpenActivity (OpenActivities)',
        '!OpportunityContactRoles': 'OpportunityContactRole (OpportunityContactRoles)',
        '!ProcessInstances': 'ProcessInstance (ProcessInstances)',
        '!ProcessSteps': 'ProcessInstanceHistory (ProcessSteps)',
        '!Tasks': 'Task (Tasks)',
      };

      entry.linkedObjectTypes.call(emitter, cfg, (error, result) => {
        if (error) return done(error);
        try {
          expect(error).to.equal(null);
          expect(result).to.deep.equal(expectedResult);
          expect(emitter.emit.withArgs('updateKeys').callCount).to.be.equal(1);
          return done();
        } catch (e) {
          return done(e);
        }
      });
    });
  });
});
