'use strict';

/**
 * Common module for serenity applications.
 * This module abstracts the url filtering methods.
 *
 * @author      spanhawk
 * @version     0.0.1
 */

var _ = require('lodash');
var errors = require('common-errors');

/**
 * Set a field=value filter to filters.
 * @param filters the filters
 * @param operator the operator
 * @param field the field name
 * @param value the field value
 */
function _setFilter(filters, operator, field, value) {
  switch (operator) {
    case '=' :
      var matched = value.match(/^in\s*\((.*)\)/);
      if (matched && matched.length === 2) {    // in operator
        var inFields = matched[1].split(',');
        var inValues = [];
        _.each(inFields, function(v) {
          // remove all ' and  trim it
          inValues.push(v.replace(/'/g, '').trim());
        });
        filters.where[field] = inValues;
      } else {
        filters.where[field] = value.replace(/'/g, ''); // = operator
      }
      break;
    case '<' : filters.where[field] = { lt: value};     // < operator
      break;
    case '>' : filters.where[field] = { gt: value};     // > operator
      break;
  }
}

/**
 * Parse filter parameter.
 * @param model the model to apply the filter
 * @param req the request
 * @param filters the filters used in the query
 * @param filterParam the filter parameter value
 */
exports.parseFilter = function(model, req, filters, filterParam, next) {
  var error;
  if (!filterParam) {
    error = new errors.ValidationError('The value of filter parameter is empty');
    return next(error);
  }
  if (filterParam instanceof Array) {
    error = new errors.ValidationError('Multiple filters parameters are provided, only one filter is supported');
    return next(error);
  }
  if (filterParam) {
    // split filter into each field[=<>]value pair
    var filterValues = filterParam.split('&');
    _.each(filterValues, function(filter) {
      var matched = filter.match(/\w+([=<>])[\w\(\,)\']+/);
      // the matched values are in array
      if (matched && matched.length === 2) {
        var operator = matched[1];
        var fieldValue = filter.split(/[=<>]/);
        var field = fieldValue[0].trim();
        var value = fieldValue[1].trim();
        if (value) {
          value = value.trim();
          // verify that field is a valid field
          if (_.keys(model.rawAttributes).indexOf(field) > -1) {
            _setFilter(filters, operator, field, value);
          } else {
            error = new errors.ValidationError('The ' + field + ' is not a valid field in the ' + model.name);
            return next(error);
          }
        }
      } else {
        error = new errors.ValidationError('The ' + filter + ' is not a valid filter');
        return next(error);
      }
    });
  } else {
    error = new errors.ValidationError('The filter is empty');
    return next(error);
  }
};

/**
 * Parse limit and offset parameters.
 * @param req the request
 * @param filters the filters used in the query
 * @param key the parameter key
 * @param value the limit or offset parameter value
 */
exports.parseLimitOffset = function(req, filters, key, value, next) {
  var error;
  if (!value) {
    error = new errors.ValidationError('The value of ' + key + ' parameter is empty');
    return next(error);
  }
  if (value && value instanceof Array) {
    error = new errors.ValidationError('Multiple '+ key +' parameters are provided, only one ' + key + ' is supported');
    return next(error);
  }
  var intValue = Number(value);
  // If value has non-digit at the end, the value becomes NaN, for example '123Abc' becomes NaN.
  if (!_.isNumber(intValue) || _.isNaN(intValue)) {
    error = new errors.ValidationError('The ' + value + ' is not a valid number');
    return next(error);
  }
  filters[key] = intValue;
};

/**
 * Parse orderBy parameter.
 * @param model the model to apply the orderBy
 * @param req the request
 * @param filters the filters used in the query
 * @param orderParam the orderBy parameter value
 */
exports.parseOrderBy = function(model, req, filters, orderParam, next) {
  var error;
  if (!orderParam) {
    error = new errors.ValidationError('The value of orderBy parameter is empty');
    return next(error);
  }
  if (orderParam instanceof Array) {
    error = new errors.ValidationError('Multiple orderBy parameters are provided, only one orderBy is supported');
    return next(error);
  }
  var orderParts = orderParam.split(/\s+/);
  if (_.keys(model.rawAttributes).indexOf(orderParts[0]) === -1) {
    error = new errors.ValidationError('The ' + orderParts[0] + ' is not a valid field in the ' + model.name);
    return next(error);
  }
  var orderFilter = '"'+orderParts[0]+'"';
  if (orderParts.length === 3) {
    error = new errors.ValidationError('Invalid orderBy parameter: ' + orderParam);
    return next(error);
  }
  // only asc or desc is supported
  if (orderParts[1]) {
    if (orderParts[1].toLowerCase() !== 'desc' && orderParts[1].toLowerCase() !== 'asc') {
      error = new errors.ValidationError('The ' + orderParts[1] + ' is not supported in orderBy parameter');
      return next(error);
    }
    orderFilter += ' ' + orderParts[1];
  }
  // validate [nulls {first|last}]
  if (orderParts.length === 4) {
    if (orderParts[2].toLowerCase() !== 'nulls') {
      error = new errors.ValidationError('The ' + orderParts[2] + ' is not supported in orderBy parameter');
      return next(error);
    }
    if (orderParts[3].toLowerCase() !== 'first' && orderParts[3].toLowerCase() !== 'last') {
      error = new errors.ValidationError('The ' + orderParts[3] + ' is not supported in orderBy parameter');
      return next(error);
    }
    orderFilter += ' ' + orderParts[2] + ' ' + orderParts[3];
  }
  // orderBy is valid!
  filters.order = orderFilter;
};