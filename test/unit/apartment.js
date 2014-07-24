/* global describe, it, before, beforeEach */
/* jshint expr:true */

'use strict';

var expect = require('chai').expect;
var Room = require('../../app/models/room');
var Renter = require('../../app/models/renter');
var Mongo = require('mongodb');
var connect = require('../../app/lib/connect');
var Apartment;

describe('Apartment', function(){
  before(function(done){
    connect('property-manager-test', function(){
      Apartment = require('../../app/models/apartment');
      done();
    });
  });
  beforeEach(function(done){
    global.mongodb.collection('apartments').remove(function(){
      done();
    });
  });

  describe('constructor', function(){
    it('should create a new apartment object', function(){
      var a1 = new Apartment('a1');
      expect(a1).to.be.instanceof(Apartment);
      expect(a1).to.be.ok;
      expect(a1.rooms).to.have.length(0);
      expect(a1.renters).to.have.length(0);
    });
  });
  describe('#area', function(){
    it('should return the total area of the apartment', function(){
      var a1 = new Apartment('a1');
      var r1 = new Room('bedroom', '10', '12');
      var r2 = new Room('living room', '12', '12');
      var r3 = new Room('bathroom', '8', '8');
      a1.rooms.push(r1, r2, r3);

      expect(a1.area()).to.equal(328);
    });
  });
  describe('#cost', function(){
    it('should return the total cost of the apartment', function(){
      var a1 = new Apartment('a1');
      var r1 = new Room('bedroom', '10', '12');
      var r2 = new Room('living room', '12', '12');
      var r3 = new Room('bathroom', '8', '8');
      a1.rooms.push(r1, r2, r3);

      expect(a1.cost()).to.equal(1640);
    });
  });
  describe('#bedrooms', function(){
    it('should return the number of bedrooms in the apartment', function(){
      var a1 = new Apartment('a1');
      var r1 = new Room('bedroom', '10', '12');
      var r2 = new Room('living room', '12', '12');
      var r3 = new Room('bathroom', '8', '8');
      a1.rooms.push(r1, r2, r3);

      expect(a1.bedrooms()).to.equal(1);
    });
  });
  describe('#isAvailable', function(){
    it('should inform if the apartment has a available bedroom', function(){
      var a1 = new Apartment('a1');
      var r1 = new Room('bedroom', '10', '12');
      var r2 = new Room('bedroom', '10', '12');
      var r3 = new Room('living room', '12', '12');
      var r4 = new Room('bathroom', '8', '8');
      var bob = new Renter('bob', '35', 'm', 'social worker');
      a1.renters.push(bob);
      a1.rooms.push(r1, r2, r3, r4);

      expect(a1.isAvailable()).to.be.true;
    });
  });
  describe('#purgeEvicted', function(){
    it('should remove evicted renters from apartment', function(){
      var a1 = new Apartment('a1');
      var renter1 = new Renter('bob', '35', 'm', 'social worker');
      var renter2 = new Renter('jim', '19', 'm', 'movie star');
      var renter3 = new Renter('sue', '27', 'f', 'coder');
      renter1.isEvicted = true;
      a1.renters.push(renter1, renter2, renter3);
      a1.purgeEvicted();
      expect(a1.renters).to.have.length(2);
    });
  });
  describe('#collectRent', function(){
    it('should reduce renters cash by percentage of rent', function(){
      var a1 = new Apartment('A1');
      // 2500 total rent
      var r1 = new Room('bedroom', '10', '10');
      var r2 = new Room('living room', '10', '10');
      var r3 = new Room('bathroom', '10', '10');
      var r4 = new Room('bedroom', '10', '10');
      var r5 = new Room('bedroom', '10', '10');

      var bob = new Renter('bob', '35', 'm', 'social worker');
      var jim = new Renter('jim', '19', 'm', 'movie star');
      var sue = new Renter('sue', '27', 'f', 'coder');
      bob.cash = 1000;
      jim.cash = 1000;
      sue.cash = 1000;
      a1.rooms.push(r1, r2, r3, r4, r5);
      a1.renters.push(bob, jim, sue);
      a1.collectRent();

      expect(bob.cash).to.be.closeTo(166.67, 0.02);
      expect(bob.isEvicted).to.be.false;
      expect(jim.cash).to.be.closeTo(166.67, 0.02);
      expect(jim.isEvicted).to.be.false;
      expect(sue.cash).to.be.closeTo(166.67, 0.02);
      expect(sue.isEvicted).to.be.false;
    });
    it('should evict renters who can\'t pay', function(){
      var a1 = new Apartment('A1');
      // 2500 total rent
      var r1 = new Room('bedroom', '10', '10');
      var r2 = new Room('living room', '10', '10');
      var r3 = new Room('bathroom', '10', '10');
      var r4 = new Room('bedroom', '10', '10');
      var r5 = new Room('bedroom', '10', '10');

      var bob = new Renter('bob', '35', 'm', 'social worker');
      var jim = new Renter('jim', '19', 'm', 'movie star');
      var sue = new Renter('sue', '27', 'f', 'coder');
      bob.cash = 1000;
      jim.cash = 500;
      sue.cash = 1000;
      a1.rooms.push(r1, r2, r3, r4, r5);
      a1.renters.push(bob, jim, sue);
      a1.collectRent();

      expect(bob.cash).to.be.closeTo(166.67, 0.02);
      expect(bob.isEvicted).to.be.false;
      expect(jim.cash).to.equal(500);
      expect(jim.isEvicted).to.be.true;
      expect(sue.cash).to.be.closeTo(166.67, 0.02);
      expect(sue.isEvicted).to.be.false;
    });
  });
  describe('#save', function(){
    it('should save apartment object to database', function(done){
      var a1 = new Apartment('a1');
      var r1 = new Room('bedroom', '10', '10');
      var r2 = new Room('living room', '10', '10');
      var r3 = new Room('bathroom', '10', '10');
      var bob = new Renter('bob', '35', 'm', 'social worker');
      a1.rooms.push(r1, r2, r3);
      a1.renters.push(bob);
      a1.save(function(){
        expect(a1._id).to.be.instanceof(Mongo.ObjectID);
        done();
      });
    });
  });

});

