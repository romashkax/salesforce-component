/**
 * Utility functions that transform Salesforce metadata to JSON Schema
 * */
const _ = require('lodash');

const FIELD_TYPE_TO_SCHEMA_TYPE = {
  'tns:ID': 'string',
  'xsd:boolean': 'boolean',
  'xsd:string': 'string',
  'xsd:dateTime': 'string',
  'xsd:double': 'number',
  'xsd:int': 'integer',
  'xsd:date': 'string',
  'xsd:time': 'string',
  'xsd:base64Binary': 'string',
};

// eslint-disable-next-line no-underscore-dangle
function _addEnum(field, result) {
  // eslint-disable-next-line no-param-reassign
  result.enum = [];
  const array = result.enum;
  _.each(field.picklistValues, (alternative) => {
    array.push(alternative.value);
  });
}

// eslint-disable-next-line no-underscore-dangle
function _fieldToProperty(field) {
  const type = FIELD_TYPE_TO_SCHEMA_TYPE[field.soapType];
  if (!type) {
    throw new Error(`Can't convert salesforce soapType ${field.soapType
    } to JSON schema type`);
  }
  const result = {
    type: FIELD_TYPE_TO_SCHEMA_TYPE[field.soapType],
    title: field.label,
    default: field.defaultValue,
    required: !field.nillable && !field.defaultedOnCreate,
    custom: field.custom,
    readonly: field.calculated || !field.updateable,
  };
  if (field.type === 'picklist') {
    _addEnum(field, result);
  }
  return result;
}

/**
 * We will filter out properties such as:
 * - Deprecated and Hidden
 * - If referenceTo is set
 * - If relationshipName is set
 * - Not creatable and not updatable
 *
 * @param field
 * @param metaType (in or out structure)
 * @returns {*}
 * @private
 */
// eslint-disable-next-line no-underscore-dangle
function _filterProperties(field, metaType) {
  if (field.name === 'ExtId__c') {
    return true;
  }
  if (field.deprecatedAndHidden) {
    return false;
  }

  if (!field.updateable && !field.createable) {
    if (metaType !== 'out') {
      return false;
    }
  }
  return true;
}

function buildSchemaFromDescription(objectDescription, metaType) {
  const result = {
    description: objectDescription.name,
    type: 'object',
    properties: {},
  };
  // eslint-disable-next-line max-len
  const filtered = _.filter(objectDescription.fields, objDesc => _filterProperties(objDesc, metaType));
  _.each(filtered, (field) => {
    const { name } = field;
    result.properties[name] = _fieldToProperty(field);
    /** When creating an object in Salesforce the field `ownerID` should be optional
     * https://github.com/elasticio/salesforce-component/issues/26
    * */
    if (name === 'OwnerId') {
      result.properties[name].required = false;
    }
  });
  return result;
}

function pickSelectFields(metadata) {
  if (!metadata || !metadata.properties || _.isEqual({}, metadata.properties)) {
    throw new Error('No out metadata found to create select fields from');
  }

  return _.keys(metadata.properties).join(',');
}

/**
 * Exported converter function
 *
 * @param source
 * @return {Object}
 */
exports.buildSchemaFromDescription = buildSchemaFromDescription;
exports.pickSelectFields = pickSelectFields;
