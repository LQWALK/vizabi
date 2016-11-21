import * as utils from 'base/utils';
import Promise from 'base/promise';
import Reader from 'base/reader';

var FILE_CACHED = {}; //caches files from this reader
var FILE_REQUESTED = {}; //caches files from this reader

var JSONReader = Reader.extend({

  /**
   * Initializes the reader.
   * @param {Object} reader_info Information about the reader
   */
  init: function(reader_info) {
    this._name = 'json';
    this._data = [];
    this._basepath = reader_info.path;
    this._parsers = reader_info.parsers;
    if(!this._basepath) {
      utils.error("Missing base path for json reader");
    };
  },

  /**
   * Reads from source
   * @param {Object} query to be performed
   * @param {String} language language
   * @returns a promise that will be resolved when data is read
   */
  read: function(query, language) {
    var _this = this;
    var p = new Promise();

    //this specific reader has support for the tag {{LANGUAGE}}
    var path = this._basepath.replace("{{LANGUAGE}}", language);
    _this._data = [];

    (function(query, p) {

      //if cached, retrieve and parse
      if(FILE_CACHED.hasOwnProperty(path)) {
        parse(FILE_CACHED[path]);
      }
      //if requested by another hook, wait for the response
      else if(FILE_REQUESTED.hasOwnProperty(path)) {
        FILE_REQUESTED[path].then(function() {
          parse(FILE_CACHED[path]);
        });
      }
      //if not, request and parse
      else {
        d3.json(path, function(error, res) {

          if(!res) {
            utils.error("No permissions or empty file: " + path, error);
            return;
          }

          if(error) {
            utils.error("Error Happened While Loading JSON File: " + path, error);
            return;
          }
          //fix JSON response
          res = format(res);

          //cache and resolve
          FILE_CACHED[path] = res;
          FILE_REQUESTED[path].resolve();
          FILE_REQUESTED[path] = void 0;

          parse(res);
        });
        FILE_REQUESTED[path] = new Promise();
      }

      function format(res) {
        //TODO: Improve local json filtering
        //make category an array and fix missing regions
        res = res[0].map(function(row) {
          row['geo.cat'] = [row['geo.cat']];
          row['geo.world_4region'] = row['geo.world_4region'] || row['geo'];
          return row;
        });

        //format data
        res = utils.mapRows(res, _this._parsers);

        //TODO: fix this hack with appropriate ORDER BY
        //order by formatted
        //sort records by time
        var keys = Object.keys(_this._parsers);
        var order_by = keys[0];
        res.sort(function(a, b) {
          return a[order_by] - b[order_by];
        });
        //end of hack

        return res;
      }

      function parse(res) {
        var data = res;
        //rename geo.category to geo.cat
        var where = query.where;
        if(where['geo.category']) {
          where['geo.cat'] = utils.clone(where['geo.category']);
          where['geo.category'] = void 0;
        }

        //format values in the dataset and filters
        where = utils.mapRows([where], _this._parsers)[0];

        //make sure conditions don't contain invalid conditions
        var validConditions = [];
        utils.forEach(where, function(v, p) {
          for(var i = 0, s = data.length; i < s; i++) {
            if(data[i].hasOwnProperty(p)) {
              validConditions.push(p);
              return true;
            }
          };
        });
        //only use valid conditions
        where = utils.clone(where, validConditions);

        data = utils.filterAny(data, where);

        //warn if filtering returns empty array
        if(data.length == 0) {
          p.reject("data reader returns empty array, that's bad");
          return;
        }

        //only selected items get returned
        data = data.map(function(row) {
          return utils.clone(row, query.select);
        });

        _this._data = data;

        p.resolve();
      }

    })(query, p);

    return p;
  },

  /**
   * Gets the data
   * @returns all data
   */
  getData: function() {
    return this._data;
  }
});

export default JSONReader;
