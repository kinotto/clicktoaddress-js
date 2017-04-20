clickToAddress.prototype.search = function(searchText, id, sequence){
	'use strict';
	/*
		sequence:
			-1	: history action (will not be stored in cache)
			0	: missing
			1+	: standard search
		type:
			0	: find
			1	: retrieve
			2	: find (from history, do not cache)
	*/
	var that = this;
	if(searchText === ''){
		return;
	}
	this.setProgressBar(0);
	var parameters = {
		key: this.key,
		query: searchText,
		id: id,
		country: this.activeCountry,
		fingerprint: this.fingerprint,
		integration: this.tag,
		js_version: this.jsVersion,
		sequence: sequence,
		type: 0
	};
	if(sequence == -1){
		parameters.type = 2;
	}
	if(typeof this.accessTokenOverride[this.activeCountry] != 'undefined'){
		parameters.key = this.accessTokenOverride[this.activeCountry];
	}
	if(this.coords != {}){
		parameters.coords = {};
		parameters.coords.lat = this.coords.latitude;
		parameters.coords.lng = this.coords.longitude;
	}

	// first check cache
	try{
		var data = this.cacheRetrieve(parameters);

		that.setProgressBar(1);
		that.clear();
		that.hideErrors();
		// return data
		that.searchResults = data;
		that.showResults();
		if(!that.focused){
			that.activeInput.focus();
		}
		that.searchStatus.lastResponseId = sequence || 0;
		// store in cache
		that.cacheStore(parameters, data, sequence);
		return;
	} catch (err) {
		if(['cc/cr/01', 'cc/cr/02'].indexOf(err) == -1){
			throw err;
		}
	}

	// Set up the URL
	var url = this.baseURL + 'find';
	this.apiRequest('find', parameters, function(data){
		if(that.searchStatus.lastResponseId <= sequence){
			that.setProgressBar(1);
			that.clear();
			that.hideErrors();
			// return data
			that.searchResults = data;
			that.showResults();
			if(!that.focused){
				that.activeInput.focus();
			}
			that.searchStatus.lastResponseId = sequence || 0;
			// store in cache
			that.cacheStore(parameters, data, sequence);
		}
	});
};
clickToAddress.prototype.getAddressDetails = function(id){
	'use strict';
	var that = this;
	var parameters = {
		id: id,
		country: this.activeCountry,
		key: this.key,
		fingerprint: this.fingerprint,
		js_version: this.jsVersion,
		integration: this.tag,
		type: 1
	};
	if(typeof this.accessTokenOverride[this.activeCountry] != 'undefined'){
		parameters.key = this.accessTokenOverride[this.activeCountry];
	}
	if(this.coords != {}){
		parameters.coords = this.coords;
	}

	// first check cache
	try{
		var data = this.cacheRetrieve(parameters);
		that.fillData(data);
		that.hideErrors();
		that.cleanHistory();
		that.cacheStore(parameters, data);
		return;
	} catch (err) {
		if(['cc/cr/01', 'cc/cr/02'].indexOf(err) == -1){
			throw err;
		}
	}

	// Set up the URL
	var url = this.baseURL + 'retrieve';
	this.apiRequest('retrieve', parameters, function(data){
		try{
			that.fillData(data);
			that.hideErrors();
			that.cleanHistory();
			that.cacheStore(parameters, data);
		} catch(e){
			that.error('JS503');
		}
	});
};

clickToAddress.prototype.getAvailableCountries = function(success_function){
	'use strict';
	var that = this;
	var parameters = {
		key: this.key,
		fingerprint: this.fingerprint,
		js_version: this.jsVersion,
		integration: this.tag,
		language: this.countryLanguage
	};
	this.apiRequest('countries', parameters, function(data){
		try{
			that.serviceReady = 1;
			that.validCountries = data.countries;
			that.ipLocation = data.ip_location;
			that.hideErrors();
			success_function();
		} catch(e){
			that.error('JS505');
		}
	});

};

clickToAddress.prototype.handleApiError = function(ajax){
	'use strict';
	if([401, 402].indexOf(ajax.status) != -1){
		this.serviceReady = -1;
	}
	var data = {};
	try{
		data = JSON.parse(ajax.responseText);
	}
	catch(e){
		data = {};
	}
	if( typeof data.error != 'undefined' && typeof data.error.status == "string" ){
		this.error(data.error.status, data.error.message);
	} else {
		this.error('JS500');
	}
};

clickToAddress.prototype.apiRequest = function(action, parameters, callback){
	// Set up the URL
	var url = this.baseURL + action;

	if(typeof this.customParameters !== 'undefined'){
		var keys = Object.keys(this.customParameters);
		for(var i=0; i<keys.length; i++){
			parameters[keys[i]] = this.customParameters[keys[i]];
		}
	}

	// Create new XMLHttpRequest
	var request = new XMLHttpRequest();
	request.open('POST', url, true);
	request.setRequestHeader('Content-Type', 'application/json');
	request.setRequestHeader('Accept', 'application/json');
	// Wait for change and then either JSON parse response text or throw exception for HTTP error
	var that = this;
	request.onreadystatechange = function() {
		if (this.readyState === 4){
			if(this.status == 401){
				// unauthorized access token
				return;
			}
			if (this.status >= 200 && this.status < 400){
				try{
					var data = JSON.parse(this.responseText);
					callback(data);
				} catch(e){
					that.error('JS506');
				}
			} else {
				that.handleApiError(this);
			}
		}
	};
	// Send request
	request.send(JSON.stringify(parameters));
	// Set timeout
	var xmlHttpTimeout = setTimeout(function(){
		if(request !== null && request.readyState !== 4){
			request.abort();
			that.error('JS501');
		}
	},10000);
	// Nullify request object
	request = null;
};
