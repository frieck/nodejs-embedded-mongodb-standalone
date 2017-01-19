'use strict';

var
  rewire = require('rewire'),
  promise = require('bluebird');

describe('index', function() {

  var
    underTest,
    downloadServiceMock,
    extractionServiceMock,
    mongoServiceMock,

    ANY_VERSION = 'ANY_VERSION',
    ANY_DOWNLOAD_DIR = 'ANY_DOWNLOAD_DIR',
    ANY_DB_PATH = 'ANY_DB_PATH',
    ANY_PORT = 'ANY_PORT',
    ANY_FILE = 'ANY_FILE';

  beforeEach(function () {
    underTest = rewire('../../lib/nems.js');

    downloadServiceMock = jasmine.createSpyObj('downloadService', ['download']);
    downloadServiceMock.download.and.returnValue(promise.resolve(ANY_FILE));

    extractionServiceMock = jasmine.createSpyObj('extractionService', ['extract']);
    extractionServiceMock.extract.and.returnValue(promise.resolve(ANY_FILE));

    mongoServiceMock = jasmine.createSpyObj('mongoService', ['start', 'stop']);
    mongoServiceMock.start.and.returnValue(promise.resolve(ANY_FILE));
    mongoServiceMock.stop.and.returnValue(promise.resolve(ANY_FILE));

    underTest.__set__('downloadService', downloadServiceMock);
    underTest.__set__('extractionService', extractionServiceMock);
    underTest.__set__('mongoService', mongoServiceMock);
  });

  it('should be defined', function () {
    expect(underTest).toBeDefined();
  });

  function testDownload(value) {
    describe(value, function() {
      it('should reject a promise if download fails', function (done) {
        var expectedError = new Error('any download error');
        downloadServiceMock.download.and.returnValue(promise.reject(expectedError));

        underTest[value]().then(function () {
          done.fail('Error should have been caught');
        }).catch(function (err) {
          expect(err).toEqual(expectedError);
          done();
        });
      });

      it('should call download on downloadService', function (done) {
        underTest[value](ANY_VERSION, ANY_DOWNLOAD_DIR).then(function () {
          expect(downloadServiceMock.download).toHaveBeenCalledWith(ANY_VERSION, ANY_DOWNLOAD_DIR);
          done();
        });
      });
    });
  }

  ['distribute', 'download'].forEach(function(value) {
    testDownload(value);
  });


  describe('extract', function() {

    it('should call extract', function (done) {
      underTest.extract(ANY_FILE, ANY_VERSION, ANY_DOWNLOAD_DIR).then(function (files) {
        expect(extractionServiceMock.extract).toHaveBeenCalledWith(ANY_FILE, ANY_VERSION, ANY_DOWNLOAD_DIR);
        expect(files).toEqual(ANY_FILE);
        done();
      });
    });
  });

  function testExtractionError(value) {
    describe(value, function() {
      it('should reject a promise if extraction fails', function (done) {
        var expectedError = new Error('any extraction error');
        extractionServiceMock.extract.and.returnValue(promise.reject(expectedError));

        underTest[value]().then(function () {
          done.fail('Error should have been caught');
        }).catch(function (err) {
          expect(err).toEqual(expectedError);
          done();
        });
      });
    });
  }

  ['distribute', 'extract'].forEach(function(value) {
    testExtractionError(value);
  });

  function testStartStopMongo(test) {
    describe(test.method + 'Mongo', function() {
      it('should reject a promise if ' + test.method + ' fails', function (done) {
        var expectedError = new Error('any ' + test.method + ' error');
        mongoServiceMock[test.method].and.returnValue(promise.reject(expectedError));

        underTest[test.method+'Mongo']().then(function () {
          done.fail('Error should have been caught');
        }).catch(function (err) {
          expect(err).toEqual(expectedError);
          done();
        });
      });

      it('should call ' + test.method, function(done) {
        underTest[test.method+'Mongo'].apply(this, test.params).then(function () {
          expect(mongoServiceMock[test.method].calls.argsFor(0)).toEqual(test.params);
          done();
        });
      });
    });
  }

  [
    { method: 'start', params: [ANY_DB_PATH, ANY_PORT, true, true] },
    { method: 'stop', params: [ANY_DB_PATH] }
  ].forEach(testStartStopMongo);

});