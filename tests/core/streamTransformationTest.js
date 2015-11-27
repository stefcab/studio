Studio = require('../../compiled/core/studio');
var BBPromise = require('bluebird');

describe("A Stream", function () {
	var SENDER_ID = 'sender_transformation',
		RECEIVER_ID = 'receiver_transformation_group',
		RECEIVER_ID2 = 'receiver_transformation_group_buffered';
	var sender = new Studio.Actor({
		id: SENDER_ID,
		process: function (message, headers) {}
	});
	var receiver = new Studio.Actor({
		id: RECEIVER_ID,
		process: function (param1,param2,param3) {
			return [param1,param2,param3];
		}
	});
	var receiver2 = new Studio.Actor({
		id: RECEIVER_ID2,
		process: function (message, headers) {
			return message;
		}
	});

	it("should be able to be grouped", function (done) {
		receiver.addTransformation(function (stream) {
			return stream.bufferWithCount(3).map(function (array) {
				var i = 0;
				var acc = {};
				for (; i < array.length; i++) {
					acc.sender = array[i].sender;
					acc.receiver = array[i].receiver;
					acc.callbacks = acc.callbacks || [];
					acc.callbacks.push(array[i].callback);
					acc.body = acc.body || [];
					acc.body.push(array[i].body[0]);
				}
				acc.callback = function (err, result) {
					var i = 0;
					for (; i < acc.callbacks.length; i++) {
						acc.callbacks[i](err, result);
					}
				};
				return acc;
			});
		});
		BBPromise.join(sender.send(RECEIVER_ID, 1), sender.send(RECEIVER_ID,
			2), sender.send(RECEIVER_ID, 3)).then(function (result) {
			expect(result[0][0]).toBe(1);
			expect(result[0][1]).toBe(2);
			expect(result[0][2]).toBe(3);
			done();
		});
	});
	it("should be able to be buffered", function (done) {
		receiver2.addTransformation(function (stream) {
			return stream.bufferWithCount(2);
		});
		BBPromise.join(sender.send(RECEIVER_ID2, 1), sender.send(RECEIVER_ID2,
			2)).then(function (result) {
			expect(result[0]).toBe(1);
			expect(result[1]).toBe(2);
			done();
		});
	});
});
