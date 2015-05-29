
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
var Search = React.createClass({
  getInitialState: function() {
    return {hasLocation: 'to',suggestions:[]};
  },
  componentWillMount : function() {
    //this.context.getStore('LocationStore').addChangeListener(this.onChange);
    //return this.setState(this.context.getStore('LocationStore').getLocationState());
  },

  componentWillUnmount : function() {
    //return this.context.getStore('LocationStore').removeChangeListener(this.onChange);
  },

  onChange : function() {
    //return this.setState(this.context.getStore('LocationStore').getLocationState());
  },

  analyzeInput : function(input) {
    var address, cities, city, containsComma, containsSpace, isAddressSearch, isLastCharSpace, isNumbersInQuery, isStopCodeSearch, number;
    containsComma = input.lastIndexOf(',') > -1;
    containsSpace = input.lastIndexOf(' ') > -1;
    isLastCharSpace = /\s+$/.test(input);
    isNumbersInQuery = input.match(/\d/) ? true : false;
    isStopCodeSearch = isNumbersInQuery && !containsSpace;
    isAddressSearch = (isNumbersInQuery || isLastCharSpace) && !isStopCodeSearch;
    cities = [];
    if (containsComma) {
      address = input.substring(0, input.lastIndexOf(',')).replace(/\d+/g, '').trim();
      city = input.substring(input.lastIndexOf(',') + 1, input.length).trim().replace(' ','');
      number = isNumbersInQuery ? input.match(/\d+/)[0] : null;
      if (city.length > 0) {
        cities.push(city.toLowerCase());
      }
    } else if (isStopCodeSearch) {
      address = input.trim();
    } else {
      address = input.replace(/\d+/g, '').trim();
      number = isNumbersInQuery ? input.match(/\d+/)[0] : null;
    }
    if (this.state && this.state.previousSuggestCities && cities.length === 0) {
      cities = cities.concat(this.state.previousSuggestCities);
    }
    return {
      isValidSearch: input.trim().length > 0,
      isLastCharSpace: isLastCharSpace,
      isNumbersInQuery: isNumbersInQuery,
      isAddressSearch: isAddressSearch,
      query: input,
      queryCities: cities,
      queryAddress: address,
      queryNumber: number
    };
  },

  findLocation : function(cities, address, number) {
    var urls;
    if (!cities || cities.length === 0) {
      //_this.props.setResult({lat:0,lon:0,city:''},this.props.aid);
      var cities = ['espoo','helsinki','vantaa'];
      console.log("Cannot find location without city information, manually setting the cities :/");
      return;
    }
    urls = cities.map(function(city) {
      return 'http://matka.hsl.fi/geocoder/' + (number ? "address/" + city + "/" + address + "/" + number : "street/" + city + "/" + address);
    });
    return XhrPromise.getJsons(urls).then((function(_this) {
      return function(cityResults) {
        var addressString, data, foundLocations, i, len;
        foundLocations = [];
        for (i = 0, len = cityResults.length; i < len; i++) {
          data = cityResults[i];
          if (data.results.length > 0) {
            foundLocations.push(data.results[0]);
          }
        }
        if (foundLocations.length === 1) {
          addressString = number ? address + " " + number + ", " + foundLocations[0].municipalityFi : address + " " + foundLocations[0].number + ", " + foundLocations[0].municipalityFi;
          
          var t = {
            type:'street',
            address: address,
            city: foundLocations[0].municipalityFi,
            selection: addressString
          };

          return _this.setLocation(foundLocations[0].location[1], foundLocations[0].location[0], foundLocations[0].municipalityFi,t);
          
        } else if (foundLocations.length > 1) {
          return console.log("Query " + address + ", " + number + ", " + cities + " returns results from more than 1 city. Cannot set location.");
        } else {
          _this.props.setResult({lat:0,lon:0,city:''},this.props.aid);
          return console.log("Cannot find any locations with " + address + ", " + number + ", " + cities);
        }
      };
    })(this), function(a){
        _this.props.setResult({lat:0,lon:0,city:''},this.props.aid);
    });
  },

  setLocation : function(lat, lon, city, address) {
    return this.props.setResult({lat:lat,lon:lon,city:city},this.props.aid);
  },

  getSuggestions : function(input, callback) {
    var analyzed;
    this.callback = callback;
    analyzed = this.analyzeInput(input);
    if (analyzed.isAddressSearch && analyzed.queryCities.length > 0) {
      return this.searchAddresses(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber, callback);
    } else {
      return this.searchSuggests(analyzed.queryAddress, callback);
    }
  },

  searchAddresses : function(cities, address, number, callback) {
    var numberRegex, urls;
    var _this = this;
    numberRegex = number ? new RegExp("^" + number) : /.*/;
    urls = cities.map(function(city) {
      return 'http://matka.hsl.fi/geocoder/' + ("street/" + city + "/" + address);
    });
    return XhrPromise.getJsons(urls).then(function(cityResults) {
      var addresses, data, i, j, len, len1, ref, staircaseSelection;
      addresses = [];
      for (i = 0, len = cityResults.length; i < len; i++) {
        data = cityResults[i];
        ref = data.results;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          address = ref[j];
          if (numberRegex.test(parseInt(address.number))) {
            staircaseSelection = address.unit != null ? address.unit : "";
            addresses.push({
              'type': 'address',
              'address': address.streetFi,
              'lat': address.location[1],
              'lon': address.location[0],
              'number': address.number,
              'staircase': address.unit,
              'city': address.municipalityFi,
              'selection': address.streetFi + " " + address.number + staircaseSelection + ", " + address.municipalityFi
            });
          }
        }
      }
      return callback(null, addresses);
    }, function(a){
      return _this.props.setResult({lat:0,lon:0,city:''},_this.props.aid);
    });
  },

  searchSuggests : function(address, callback) {
    var cities;
    cities = "city=helsinki&city=vantaa&city=espoo";
    return XhrPromise.getJson('http://matka.hsl.fi/geocoder/' + ("suggest/" + address + "?" + cities)).then((function(_this) {
      return function(data) {
        var all, city, i, j, len, len1, ref, ref1, stops, street, streetName, streets, uniqueCities;
        streets = [];
        uniqueCities = [];
        ref = data.streetnames_fi;
        for (i = 0, len = ref.length; i < len; i++) {
          street = ref[i];
          for (streetName in street) {
            cities = street[streetName];
            for (j = 0, len1 = cities.length; j < len1; j++) {
              city = cities[j];
              streets.push({
                'type': 'street',
                'address': "" + streetName,
                'city': "" + city.key,
                'selection': streetName + ", " + city.key
              });
              if ((ref1 = city.key.toLowerCase(), indexOf.call(uniqueCities, ref1) < 0) && streetName.toLowerCase() === address.toLowerCase()) {
                uniqueCities.push(city.key.toLowerCase());
              }
            }
          }
        }
        _this.setState({
          previousSuggestCities: uniqueCities
        });
        stops = data.stops.map(function(result) {
          return {
            'type': 'stop',
            'address': result.nameFi,
            'city': result.municipalityFi,
            'lat': result.location[1],
            'lon': result.location[0],
            'stopCode': result.stopCode,
            'selection': result.nameFi + " (" + result.stopCode + "), " + result.municipalityFi
          };
        });
        if (streets.length === 1 && stops.length === 0) {
          _this.searchAddresses([streets[0].city], streets[0].address, null, callback);
          return callback(null, all);
        } else {
          all = streets.concat(stops);
          _this.setState({suggestions: all})
          return callback(null, all);
        }
      };
    })(this));
  },

  renderSuggestion : function(suggestion, input) {
    var afterMatch, beforeMatch, firstMatchIndex, icon, lastMatchIndex, match, reqex, value;
    value = suggestion.selection;
    reqex = new RegExp('\\b' + value, 'i');
    firstMatchIndex = value.toLowerCase().indexOf(input.toLowerCase());
    lastMatchIndex = firstMatchIndex + input.length;
    switch (suggestion.type) {
      case 'street':
        icon = "<svg viewBox=\"0 0 40 40\" class=\"icon\"><use xlink:href=\"#icon-icon_place\"></use></svg>";
        break;
      case 'address':
        icon = "<svg viewBox=\"0 0 40 40\" class=\"icon\"><use xlink:href=\"#icon-icon_place\"></use></svg>";
        break;
      case 'stop':
        icon = "<svg viewBox=\"0 0 40 40\" class=\"icon\"><use xlink:href=\"#icon-icon_direction-b\"></use></svg>";
        break;
      default:
        icon = "<span>*</span>";
    }
    if (firstMatchIndex === -1) {
      return React.createElement("span", null, React.createElement("span", {
        "dangerouslySetInnerHTML": {
          __html: icon
        }
      }), value);
    }
    beforeMatch = value.slice(0, firstMatchIndex);
    match = value.slice(firstMatchIndex, lastMatchIndex);
    afterMatch = value.slice(lastMatchIndex, value.length);
    return React.createElement("span", {
      "id": value
    }, React.createElement("span", {
      "dangerouslySetInnerHTML": {
        __html: icon
      }
    }), beforeMatch, React.createElement("strong", null, match), afterMatch);
  },

  suggestionValue : function(suggestion) {
    return suggestion.selection;
  },

  suggestionSelected : function(suggestion, e) {
    var analyzed;
    e.preventDefault();
    if (suggestion.lat !== void 0 && suggestion.lon !== void 0) {
      return this.setLocation(suggestion.lat, suggestion.lon, suggestion.city);
    } else {
      analyzed = this.analyzeInput(suggestion.selection);
      this.searchAddresses(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber, this.callback);
      return this.findLocation(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber);
    }
  },

  handleAutoSuggestMount : function(autoSuggestComponent) {
    var input;
    if (autoSuggestComponent) {
      input = autoSuggestComponent.refs.input.getDOMNode();
      input.addEventListener('keydown', this.suggestionArrowPress);
      return this.autoSuggestInput = input;
    }
  },

  suggestionArrowPress : function(e) {
    var autoSuggestDiv, autoSuggestDivs, selectedSuggestion, suggestions;
    if(e.which === 9) {
       analyzed = this.analyzeInput(this.autoSuggestInput.value);
       return this.findLocation(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber);
    }
    if (e.which !== 38 && e.which !== 40) {
      return;
    }
    suggestions = document.getElementsByClassName("react-autosuggest__suggestion--focused");
    if (suggestions.length === 0) {
      return;
    }
    selectedSuggestion = suggestions[0];
    autoSuggestDivs = document.getElementsByClassName("react-autosuggest__suggestions");
    if (autoSuggestDivs.length === 0) {
      return;
    }
    autoSuggestDiv = autoSuggestDivs[0];
    if (e.which === 38) {
      return autoSuggestDiv.scrollTop = selectedSuggestion.offsetTop - 90;
    } else if (e.which === 40) {
      return autoSuggestDiv.scrollTop = selectedSuggestion.offsetTop - 60;
    }
  },
  onSubmit : function(e) {
    var analyzed;
    e.preventDefault();
    analyzed = this.analyzeInput(this.autoSuggestInput.value);
    return this.findLocation(analyzed.queryCities, analyzed.queryAddress, analyzed.queryNumber);
  },

  render : function() {
    var inputAttributes, inputDisabled;
    inputDisabled = "";
    inputAttributes = {
      id: this.props.aid,
      placeholder: this.props.placeholder,
      disabled: inputDisabled
    };
    return (
    <form onSubmit={this.onSubmit}>
      <Autosuggest
        id={this.props.aid}
        ref={this.handleAutoSuggestMount}
        key={this.props.aid}
        inputAttributes={inputAttributes}
        suggestions={this.getSuggestions}
        suggestionRenderer={this.renderSuggestion}
        suggestionValue={this.suggestionValue}
        onSuggestionSelected={this.suggestionSelected}
        showWhen={((function(_this) {
          return function(input) {
            return input.trim().length >= 2;
          };
        })(this))} />
    </form>
    );
  }
});