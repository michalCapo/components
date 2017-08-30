COMPONENT('shoppingcart', 'discount:0;expiration:6 days', function(self, config) {

	var self = this;

	self.singleton();
	self.readonly();

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'discount':
				self.sum();
				break;
		}
	};

	self.make = function() {
		var items = CACHE('shoppingcart');
		if (items && items.length) {
			var datasource = self.prepare();
			datasource.items = items;
		}
		self.sum(true);
	};

	self.prepare = function() {
		var datasource = self.get();

		!datasource && (datasource = {});

		if (!datasource.items) {
			datasource.items = [];
			datasource.price = 0;
			datasource.count = 0;
			datasource.sum = 0;
			datasource.discount = config.discount;
			self.set(datasource);
		}

		return datasource;
	};

	self.sync = function(callback) {
		var datasource = self.prepare();
		var id = [];
		for (var i = 0; i < datasource.length; i++)
			id.push(datasource[i].id);
		callback(id, datasource);
	};

	self.read = function(id) {
		return self.prepare().items.findItem('id', id);
	};

	self.has = function(id) {
		var datasource = self.prepare().items;
		return id ? datasource.items.findItem('id', id) != null : datasource.items.length > 0;
	};

	self.add = function(id, price, count, name) {
		var datasource = self.prepare();
		var item = datasource.items.findItem('id', id);
		if (item) {
			item.price = price;
			item.count += count || 1;
		} else {
			item = { id: id, price: price, count: count || 1, name: name, created: new Date() };
			datasource.items.push(item);
		}
		self.sum();
		EMIT('shoppingcart.add', item);
	};

	self.upd = function(id, count) {
		var datasource = self.prepare();
		var item = datasource.items.findItem('id', id);
		if (item) {
			item.count = count;
			!count && (datasource.items = datasource.items.remove('id', id));
			self.sum();
			EMIT('shoppingcart.upd', item);
		}
	};

	self.items = function() {
		var datasource = self.get();
		return datasource ? (datasource.items || EMPTYARRAY) : EMPTYARRAY;
	};

	self.rem = function(id) {
		var datasource = self.prepare();
		datasource.items = datasource.items.remove('id', id);
		self.sum();
		EMIT('shoppingcart.rem', id);
	};

	self.clear = function() {
		var datasource = self.prepare();
		datasource.items = [];
		self.sum();
		EMIT('shoppingcart.clear');
	};

	self.sum = function(init) {
		var datasource = self.prepare();

		datasource.count = 0;
		datasource.price = 0;
		datasource.sum = 0;

		datasource.items.forEach(function(item) {
			datasource.count += item.count;
			datasource.price += item.price * item.count;
			item.sum = config.discount ? item.price - ((item.price / 100) * config.discount) : item.price;
		});

		if (config.discount)
			datasource.sum = datasource.price - ((datasource.price / 100) * config.discount);
		else
			datasource.sum = datasource.price;

		!init && CACHE('shoppingcart', datasource.items, config.expiration);
		self.update(true);
	};
});